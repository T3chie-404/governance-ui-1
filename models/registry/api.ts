import { PROGRAM_VERSION_V1 } from '@solana/spl-governance'

import { PublicKey } from '@solana/web3.js'
import {
  HOLAPLEX_GRAPQL_URL_DEVNET,
  HOLAPLEX_GRAPQL_URL_MAINNET,
} from '@tools/constants'
import { arrayToMap } from '@tools/core/script'
import axios from 'axios'
import { gql } from 'graphql-request'

import devnetRealms from 'public/realms/devnet.json'
import mainnetBetaRealms from 'public/realms/mainnet-beta.json'
import type { ConnectionContext } from 'utils/connection'
import { equalsIgnoreCase } from '../../tools/core/strings'

export interface RealmInfo {
  symbol: string
  programId: PublicKey
  programVersion?: number
  realmId: PublicKey
  website?: string
  // Specifies the realm mainnet name for resource lookups
  // It's required for none mainnet environments when the realm name is different than on mainnet
  displayName?: string
  // Website keywords
  keywords?: string
  // twitter:site meta
  twitter?: string
  // og:image
  ogImage?: string

  // banner mage
  bannerImage?: string

  // Allow Realm to send email/SMS/Telegram/etc., notifications to governance members using Notifi
  enableNotifi?: boolean

  isCertified: boolean

  // 3- featured DAOs  ,2- new DAO with active proposals, 1- DAOs with active proposal,
  sortRank?: number

  // The default shared wallet of the DAO displayed on the home page
  // It's used for crowdfunding DAOs like  Ukraine.SOL or #Unchain_Ukraine
  sharedWalletId?: PublicKey

  communityMint?: PublicKey
}

export function getProgramVersionForRealm(realmInfo: RealmInfo) {
  // TODO: as a temp fix V1 is returned by default
  return realmInfo?.programVersion ?? PROGRAM_VERSION_V1
}

interface RealmInfoAsJSON
  extends Omit<
    RealmInfo,
    'programId' | 'realmId' | 'isCertified' | 'sharedWalletId' | 'communityMint'
  > {
  enableNotifi?: boolean
  programId: string
  realmId: string
  sharedWalletId?: string
  communityMint?: string
}

// TODO: Once governance program clones registry program and governance
//       accounts metadata is on-chain the list should be moved there
const MAINNET_REALMS = parseCertifiedRealms(mainnetBetaRealms)
const DEVNET_REALMS = parseCertifiedRealms(devnetRealms)

function parseCertifiedRealms(realms: RealmInfoAsJSON[]) {
  return realms.map((realm) => ({
    ...realm,
    programId: new PublicKey(realm.programId),
    realmId: new PublicKey(realm.realmId),
    sharedWalletId: realm.sharedWalletId && new PublicKey(realm.sharedWalletId),
    isCertified: true,
    programVersion: realm.programVersion,
    enableNotifi: realm.enableNotifi ?? true, // enable by default
    communityMint: realm.communityMint && new PublicKey(realm.communityMint),
  })) as ReadonlyArray<RealmInfo>
}

// Returns certified realms
// Note: the certification process is currently done through PRs to this repo
// This is a temp. workaround until we have the registry up and running
export function getCertifiedRealmInfos({ cluster }: ConnectionContext) {
  return cluster === 'mainnet' ? MAINNET_REALMS : DEVNET_REALMS
}

export function getCertifiedRealmInfo(
  realmId: string,
  connection: ConnectionContext
) {
  if (!realmId) {
    return undefined
  }

  const realmInfo = getCertifiedRealmInfos(connection).find(
    (r) =>
      equalsIgnoreCase(r.realmId.toBase58(), realmId) ||
      equalsIgnoreCase(r.symbol, realmId)
  )

  return realmInfo
}

// Whitelist of Realms we exclude even from the Unchartered category
// This should be part of the governance/realm registry and curated by the community

// Some fo the realms seem to be autogenerated using names like ckvq40oin3030171ylqhx37z53m.
// If they keep getting added we might want to use some pattern to exclude them

// Other excluded ones are know test DAOs like Test 'Grape Test' for example
//hidden realms
const EXCLUDED_REALMS = new Map<string, string>([
  ['HtV3PXqDhuPoCTDfYhaWxrs5e7oYk96zYpiWSrWCj6FC', ''],
  ['3mBJhp6w7Sqi6JhbnNvV6yi3RHDveUGsmzeyWprBFBWB', ''],
  ['4Q1s1vQkgfnyZNWdhehQ8q8jwy4zAtFnznzRVqs72VF3', ''],
  ['3wMVntu1fPdUbk1RLm5vSnGoiapK2ALqf6NENtescMqr', ''],
  ['98hsdTteLBUTiBCLq399QGZJr3bLQMoZe4TYyzNhRkDF', ''],
  ['2tmd2zN3TRGGjDKaRtvLRWgkwNQGQQL4p81btR59qrJX', ''],
  ['EtwCjZW4toGDzWDtSsCHueAduEW3E2JNDssKJGf3e6fz', ''],
  ['2yPZWLpsLgs4BT53J2k8vjqBZoXpWBNWJ3CdpmBVZdam', ''],
  ['Gn43s7KsVPC8rYhrK4DouQ4iiG49SpegjEKfSgkeEfNW', ''],
  ['24PDx9UiyVKsgHdtb17mdjngNDk1ZQ9ASNG3cKSWRqsU', ''],
  ['BS1ujZP29jvLGMiVgdqsZE1GMAemEdoJvJuaWWRBMWnD', ''],
  ['2dHH8GciYQNXVf2FqiB9rrqUTsLijoZv2U8DLZd6CfXF', ''],
  ['2F96LbxCv2VdmAy3psyBmfwjULU5vJmnoaaW8AKAuKjd', ''],
  ['Ad7bjv7pugibV1TbpD3FTubk17L5FxXcLWr54yF8kmj', ''],
  ['2RQ9KQUJocKasNeNniAqwuDL3tPVsyxuPPtgjHgcKaYG', ''],
  ['6E7RUhSYnYidySEpGFMhwfG1jDYnWqYBu6sHadmFRPXt', ''],
  ['DU4LCYgMA3Krupm5zdiGQVTfsabD2mqhrEHdmSWkCYcQ', ''],
  ['6smJyNvvyKSZdQu1qnvdSyQUjHPhgEB4APEDsQVELE28', ''],
  ['6vX5gasMN6XevEEaXLHRvrkm3B8irtVnEEiMMDP37rTb', ''],
  ['3UHqhBG1sju6685QrcH9d8WJVEW2Us5AnGsTY1Lh2Kxf', ''],
  ['7Pm2249LrXxLLVPJumUsBVR6FuPhDJxXxfiWbjZ8DP1T', ''],
  ['6ezQ3Z18YDCWUj83tKk21JB73ptu1CNcZCfgVBcfx59Z', ''],
  ['DgYzfAF8uh5QQTXREYaUZK7P6crNPrWDGqLBBbytkKGs', ''],
  ['DVYnCzaXVi8LeARnMUbMHTF9K7eN9AM8oVxvJLNmwABe', ''],
  ['BQVzxd7BKrbE7WyZ5mzQjcyjgxpmjURXu5HpU4K4dsBg', ''],
  ['2o7fFryGHyTfb2pB4ph3xybPSN2WAGWExp53jU8bacjW', ''],
  ['JxTAAbnXRd13CPz5PDZeDsFpxy9ADL3BV28YsDT1N5k', ''],
  ['HcnRFMcJNzSH9J1332swEhWc91CSGjJwfyYACpd2ZWke', ''],
  ['2ZF1CNK1GpYHuSpBvWAjKU4LMfEziEJmZV4eGsCUNR3L', ''],
  ['GBjvsTy4d3V7nzvUD8pgX4hTKkok4m76RDHYyHvoRTsd', ''],
  ['6pwXZrHvHc44Mg8c6rEZbEWzSBreWnP5DAYkt2vfhWjU', ''],
  ['5LSkHM5BsgM5m7wLy222kvhWceYK5e1sZ5DHHU8G8pP', ''],
  ['Gj8WE4jVZf9BCEUgtkShSoicPrTU4jhoyqi4d52ayAhY', ''],
  ['HxsBLUnTz4tTEbJzPbNY69At1B99T9yvVouskPJGEjF', 'Grape Test'],
  ['2aia1CN3YoFergRxyDTPed5Kup4LDmZMEgWxEzZ7vaKB', ''],
  ['AX2wfHP9NQ6z8JA4exmHnfkqgxiBb4Kcv6BjR8NJFhgL', ''],
  ['EroKomMwa4m7Q4PEUNy3nHRjeZ49P3A5CmomNeRm2kFR', ''],
  ['5rWb6R9bC5LZ6RuGQXLdLhxWW6F2418nrSMUnSduUHPr', ''],
  ['5pNokKBsf5EaAVrFbKPuhoYiCu7awsiGsmYqnKwpjvxr', ''],
  ['3DisadCQ4Tn4FoNkYHB6ZngVSxqomVmhAzCfxEVmrkj6', ''],
  ['AeUazJsjGVrxKWkTi5PQ4S4JxWXQ3mYHNS1mURD9GeNg', ''],
  ['AMRC14FwwWkT5TG2ibXdLTUnVrnd2N4YsTifzCeRR22X', ''], // Chicken Tribe test
  ['oW5X5C9wrnchcd4oucv8RG7t1uQLRKyevgy3GPMDTst', ''], // Succeed.Finance test
  ['3BHrYe5SV2VqHqpEyxYYLbNeNGEnKBjYG4kt6pF5Xu5K', ''], // Woof DAO test
  ['9Xe5qW76XPhyohKaz8joecybGnKrgT4N6JNEuM5ZZwa9', ''], // 1SOL test
  ['2mDwFhax7XcudkVzoV85pxo3B5aRqCt3diavVydjkBJC', ''], // 1SOL test
  ['DkSvNgykZPPFczhJVh8HDkhz25ByrDoPcB32q75AYu9k', ''], // UXDProtocolDAO test
  ['CvAD2XnHuJCzTyqRRHZtqRigVw11i9CDH8ACRGQpxhuf', ''], // Savana Sins Club
  ['AxuK6ZGEQS2vrLXwJeK5pZFBAAPamEUyQXptfEEnCHuD', ''],
  ['24pZ9VkpRGTH6wHqjSsySYHpxAKbQL1Tczb6b7zytomZ', ''],
  ['2HpvQJNTXgso4HWTXamiRAXshRyGu4ZhJ5esDT3tHPUV', ''], // Epics DAO (Dead because of loosing vote power)
  ['Hd7hrf1fyZN5ZkuCerpfXs4UCAgoHELyiscE4utaKhSx', ''],
])

// Returns all known realms from all known spl-gov instances which are not certified
export async function getUnchartedRealmInfos(connection: ConnectionContext) {
  const certifiedRealms = getCertifiedRealmInfos(connection)
  const queryUrl =
    connection.cluster === 'devnet'
      ? HOLAPLEX_GRAPQL_URL_DEVNET
      : HOLAPLEX_GRAPQL_URL_MAINNET
  const query = gql`
    query realms($limit: Int!, $offset: Int!) {
      realms(limit: $limit, offset: $offset) {
        name
        programId
        address
      }
    }
  `
  const allRealms: {
    data: { data: { realms: UnchartedRealm[] } }
  } = await axios.post(queryUrl, {
    query,
    variables: {
      limit: 10000,
      offset: 0,
    },
  })
  const sortedRealms = allRealms.data.data.realms.sort((r1, r2) =>
    r1.name.localeCompare(r2.name)
  )

  const excludedRealms = arrayToMap(certifiedRealms, (r) =>
    r.realmId.toBase58()
  )

  return Object.values(sortedRealms)
    .map((r) => {
      return !(excludedRealms.has(r.address) || EXCLUDED_REALMS.has(r.address))
        ? createUnchartedRealmInfo(r)
        : undefined
    })
    .filter(Boolean) as readonly RealmInfo[]
}

export function createUnchartedRealmInfo(realm: UnchartedRealm) {
  return {
    symbol: realm.name,
    programId: new PublicKey(realm.programId),
    realmId: new PublicKey(realm.address),
    displayName: realm.name,
    isCertified: false,
    enableNotifi: true, // enable by default
  } as RealmInfo
}

type UnchartedRealm = {
  name: string
  programId: string
  address: string
}
