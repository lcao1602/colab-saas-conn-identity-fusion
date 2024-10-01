import { Account } from 'sailpoint-api-client'
import { Config } from '../model/config'
import { ContextHelper } from '../contextHelper'
import { SDKClient } from '../sdk-client'
import { buildAccountAttributesObject, lm } from '.'
import { logger } from '@sailpoint/connector-sdk'
import { lig3 } from './lig'

/**
 * Digs through the LID historical sources and retrieve
 * the LID that is highest priority from the configured sources
 *
 * If none is found, generate a new LID
 *
 * @param context the configured context
 * @param account the identity account of interest
 * @param sourceAccounts any found source accounts to retrieve the lid
 * @param config the connector config
 * @returns the LID number corresponding to the account
 */

export const retrieveAndUpdateLidForAccount = async (
    context: ContextHelper,
    account: Account,
    client: SDKClient,
    config: Config
): Promise<Account> => {
    const formattedMap = config.lid_filterAttributesMap.map((map) => ({ ...map, uidOnly: false }))
    const accountAttributesToMatch = buildAccountAttributesObject(account, formattedMap)
    const searchField = Object.values(accountAttributesToMatch).join('').toUpperCase()
    const historicalLid =
        context.historicalLidAccounts.get(searchField) ?? (await fuzzySearchBestMatchLid(context, config, searchField))

    if (!!historicalLid) {
        // retrieve the best match
        account.attributes![config.lid_field] = historicalLid
    } else {
        const createdAccount = await createHistoricalLidEntryForAccount(
            context,
            account,
            client,
            config,
            accountAttributesToMatch
        )

        account.attributes![config.lid_field] = createdAccount.attributes![config.lid_field]
    }

    return account
}

const createHistoricalLidEntryForAccount = async (
    context: ContextHelper,
    account: Account,
    client: SDKClient,
    config: Config,
    accountAttributesToMatch?: { [key: string]: any }
): Promise<Account> => {
    // assign the search field for future lookup
    const formattedMap = config.lid_filterAttributesMap.map((map) => ({ ...map, uidOnly: false }))
    accountAttributesToMatch ??= buildAccountAttributesObject(account, formattedMap)

    const lidSource = context.getLidSource()
    const futureLookupValue = config.lid_filterAttributesMap
        .map((map) => accountAttributesToMatch[map.identity].toUpperCase())
        .join('')

    // only create a LID record if it's possible to look it up in the future
    if (!futureLookupValue) {
        logger.error(
            lm(
                `Failed to create historical LID entry for account with ${account.id}. No lookup value could be generated`,
                'retrieveAndUpdateLidForAccount',
                1
            )
        )
        return account
    }

    // assign the newly created lid, if the account already comes with a LID, use it instead.
    const newLidForAccount = !!account.attributes![config.lid_field]
        ? `${account.attributes![config.lid_field]}`
        : `${context.getNextLid()}`.padStart(config.lid_maxLength, '0')

    const accountToCreate = await context.getNewMappedAccountForSourceFromAccount(
        account,
        lidSource,
        formattedMap,
        accountAttributesToMatch
    )
    accountToCreate.attributes![config.lid_field] = newLidForAccount
    accountToCreate.attributes![config.lid_searchField] = futureLookupValue

    try {
        // const createdAccount = await client.createAccount(accountToCreate, lidSource)
        const createdAccount = accountToCreate
        if (createdAccount) {
            context.historicalLidAccounts.set(futureLookupValue, newLidForAccount)
            account.attributes![config.lid_field] = newLidForAccount
            account.attributes![config.lid_searchField] = futureLookupValue
        } else throw new Error('Failed to create LID account')
    } catch (error) {
        logger.error(
            lm(
                `Failed to create historical LID entry for account with ${account.id}.`,
                'retrieveAndUpdateLidForAccount',
                1
            )
        )
        throw error
    }

    return account
}

export const fuzzySearchBestMatchLid = async (
    context: ContextHelper,
    config: Config,
    searchField: string
): Promise<string | undefined> => {
    const maxScore = 0
    let res = undefined

    context.historicalLidAccounts.forEach((lid, search) => {
        const score = lig3(searchField, search) * 100
        if (score >= config.lid_matchingScoreThreshold && score > maxScore) res = lid
    })

    return res
}
