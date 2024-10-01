import { writeFileSync } from 'fs'
import { join } from 'path'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

export function generateCSV(numRows: number, folderPath: string): void {
    const accountRows = []
    const lidRows = []
    const uvidRows = []
    const uvids = new Set<string>()

    for (let i = 0; i < numRows; i++) {
        const row: any = {}
        const dob = new Date(+new Date() - Math.random() * 1e12)
        const formattedDob = `${dob.getMonth() + 1}/${dob.getDate()}/${dob.getFullYear()}`
        row.dob = formattedDob
        row.lid = `${String(i).padStart(7, '0')}`
        row.lawsonId = `B${String(i).padStart(7, '0')}`

        row.firstname = uniqueNamesGenerator({ dictionaries: [names] })
        row.lastname = uniqueNamesGenerator({ dictionaries: [names] })

        let uvid = (row.firstname[0] + row.lastname).toLowerCase()
        let counter = 1
        while (uvids.has(uvid)) {
            uvid = (row.firstname[0] + row.lastname + counter).toLowerCase()
            counter++
        }
        uvids.add(uvid)
        row.uvid = uvid
        row.searchField = `${row.firstname}${row.lastname}${row.dob}`.toUpperCase()
        accountRows.push({
            lawsonId: row.lawsonId,
            dob: row.dob,
            firstname: row.firstname,
            lastname: row.lastname,
        })
        lidRows.push({ searchField: row.searchField, lid: row.lid })
        uvidRows.push({ lid: row.lid, uvid: row.uvid })
    }

    const accountsCsvContent = [
        Object.keys(accountRows[0]).join(','),
        ...accountRows.map((row) => Object.values(row).join(',')),
    ].join('\n')
    const lidCsvContent = [
        Object.keys(lidRows[0]).join(','),
        ...lidRows.map((row) => Object.values(row).join(',')),
    ].join('\n')
    const uvidCsvContent = [
        Object.keys(uvidRows[0]).join(','),
        ...uvidRows.map((row) => Object.values(row).join(',')),
    ].join('\n')
    writeFileSync(join(folderPath, 'accounts.csv'), accountsCsvContent)
    writeFileSync(join(folderPath, 'lids.csv'), lidCsvContent)
    writeFileSync(join(folderPath, 'uvids.csv'), uvidCsvContent)
}

/// usage 
/// generateCSV(1e5, join(__dirname, 'data'))
