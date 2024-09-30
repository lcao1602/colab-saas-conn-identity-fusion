import { SourceManagementWorkgroup } from 'sailpoint-api-client'

export interface Config {
    attributeMerge: 'multi' | 'concatenate' | 'first'
    baseurl: string
    beforeProvisioningRule: string | null
    clientId: string
    clientSecret: string
    cloudCacheUpdate: number
    cloudDisplayName: string
    cloudExternalId: string
    commandType: string
    connectionType: string
    connectorName: string
    deleteThresholdPercentage: number
    deleteEmpty: boolean
    formPath: string | null
    healthy: boolean
    idnProxyType: string
    invocationId: string
    managementWorkgroup: SourceManagementWorkgroup | null
    merging_isEnabled: boolean
    merging_attributes: string[]
    merging_expirationDays: number
    merging_map: {
        account: string[]
        identity: string
        uidOnly: boolean
        attributeMerge?: 'multi' | 'concatenate' | 'first' | 'source'
        source?: string
        merging_score?: number
    }[]
    global_merging_score: boolean
    merging_score?: number
    since: string
    sourceDescription: string
    sources: string[]
    spConnectorInstanceId: string
    spConnectorSpecId: string
    spConnectorSupportsCustomSchemas: boolean
    status: string
    templateApplication: string
    uid_case: 'same' | 'lower' | 'upper'
    uid_digits: number
    uid_normalize: boolean
    uid_scope: 'source' | 'platform'
    uid_spaces: boolean
    uid_template: string
    version: number
    reset: boolean
    forceAggregation: boolean
    getScore: (sourceName?: string, attribute?: string) => number
    /* LID configs */
    lid_field: string
    lid_start: number
    lid_maxLength: number
    lid_source: string
    lid_searchField: string
    lid_filterAttributesMap: MergingMapBase[]
    lid_mergingMap: MergingMapBase[]
    lid_matchingScoreThreshold: number
    /* UVID configs */
    uvid_field: string
    uvid_source: string
    uvid_mergingMap: MergingMapBase[]
    uvid_case: 'same' | 'lower' | 'upper'
    uvid_minCounterDigits: number
    uvid_maxLength?: number
    uvid_normalize: boolean
    uvid_spaces: boolean
    uvid_template: string
    /* Source dependent dedup config */
    sourceDependentDedupeConfig?: SourceDependentDedupeConfig[]
}

export interface SourceDependentDedupeConfig {
    source: string
    mergeThreshold: number
    formThreshold: number
}

export interface MergingMapBase {
    account: string[]
    identity: string
}

export interface AccountMergingMap extends MergingMapBase {
    uidOnly: boolean
}

export interface MergingMap extends AccountMergingMap {
    attributeMerge?: 'multi' | 'concatenate' | 'first' | 'source'
    source: string | undefined
    merging_score?: number
}

export interface UIDConfig {
    case: 'same' | 'lower' | 'upper'
    minCounterDigits: number
    maxLength?: number
    normalize: boolean
    spaces: boolean
    template: string
}
