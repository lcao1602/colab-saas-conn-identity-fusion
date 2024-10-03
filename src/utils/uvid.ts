import { Account } from 'sailpoint-api-client'
import { ContextHelper } from '../contextHelper'
import { Config, UIDConfig } from '../model/config'
import { SDKClient } from '../sdk-client'
import { _buildUniqueID } from './unique'
import { buildAccountAttributesObject, lm } from '.'
import { logger } from '@sailpoint/connector-sdk'

/**
 * Digs through the UVID historical records and retrieve the UVID
 * for the specified account using the LID.
 * This should only be called when the account's LID has already
 * been determined and stored. If not, the process will attempt
 * to retrieve the LID for the account.
 *
 * If no UVID historical records is found, the system will generate
 * one following the config of the connector, and store the record
 * in the configured UVID source.
 *
 *
 * @param context request context
 * @param account account of interest
 * @param client the sdk client that was init
 * @param config the request config
 * @returns the modified account
 */
export const retrieveAndUpdateUvidForAccount = async (
    context: ContextHelper,
    account: Account,
    client: SDKClient,
    config: Config
): Promise<Account> => {
    // the lid must have already been created
    // if not just return the account.
    if (!account.attributes![config.lid_field])
        throw new Error('Unable to retrieve UVID for account, missing required LID')

    const historicalUvid = context.historicalUvidAccounts.get(account.attributes![config.lid_field])

    if (!!historicalUvid) {
        account.attributes![config.uvid_field] = historicalUvid
    } else {
        const createdAccount = await createHistoricalUvidEntryForAccount(context, account, client, config)
        account.attributes![config.uvid_field] = createdAccount.attributes![config.uvid_field]
    }

    return account
}

const createHistoricalUvidEntryForAccount = async (
    context: ContextHelper,
    account: Account,
    client: SDKClient,
    config: Config,
    accountAttributesToMatch?: { [key: string]: any }
): Promise<Account> => {
    // assign the search field for future lookup
    const formattedMap = config.uvid_mergingMap.map((map) => ({ ...map, uidOnly: false }))
    accountAttributesToMatch ??= buildAccountAttributesObject(account, formattedMap)

    const uvidSource = context.getUvidSource()
    // assign the newly created lid, if the account already comes with a LID, use it instead.
    const uidConfig: UIDConfig = {
        case: config.uvid_case,
        minCounterDigits: config.uvid_minCounterDigits,
        maxLength: config.uvid_maxLength,
        normalize: config.uvid_normalize,
        spaces: config.uvid_spaces,
        template: config.uvid_template,
    }
    // get the uvid without the counter
    const baseUvid = await _buildUniqueID(account, uidConfig, formattedMap, new Set(), true)
    // get any duplicated uvid in the source
    const existingIds = Array.from(context.historicalUvidAccounts.values()).filter((uvid) => uvid.startsWith(baseUvid))
    // properly create a uvid with the counter
    const uvid = await _buildUniqueID(account, uidConfig, formattedMap, new Set(existingIds), true)
    const accountToCreate = await context.getNewMappedAccountForSourceFromAccount(
        account,
        uvidSource,
        formattedMap,
        accountAttributesToMatch
    )
    accountToCreate.attributes![config.uvid_field] = uvid

    try {
        const createdAccount = await client.createAccount(accountToCreate, uvidSource)
        // const createdAccount = accountToCreate
        if (createdAccount) {
            context.historicalUvidAccounts.set(account.attributes![config.lid_field], uvid)
            account.attributes![config.uvid_field] = uvid
        } else throw new Error('Failed to create UVID account')
    } catch (error) {
        logger.error(
            lm(
                `Failed to create historical UVID entry for account with ${account.id}.`,
                'createHistoricalUvidEntryForAccount',
                1
            )
        )
        throw error
    }
    return account
}
