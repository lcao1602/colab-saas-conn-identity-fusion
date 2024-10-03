import { writeFileSync } from 'fs'
import { join } from 'path'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

export function generateCSV(numRows: number, folderPath: string): void {
    const accountRows: any[] = []
    const lidRows: any[] = []
    const uvidRows: any[] = []
    const uvids = new Set<string>()

    for (let i = 1; i <= numRows; i++) {
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
            firstname: row.firstname,
            LastName: row.lastname,
            DOB: row.dob,
            LID: '',
            LawsonId: row.lawsonId,
            email: 'none@test.com',
            affiliation: 'employee',
            status: 'A',
        })
        lidRows.push({
            LawsonId: row.lawsonId,
            LID: row.lid,
            'Legal First Name': row.firstname,
            'Legal Middle Name': '',
            'Legal Last Name': row.lastname,
            'Preferred First Name': row.firstname,
            'Preferred Last Name': row.lastname,
            groups: '',
            'Consolidated Search Field': row.searchField,
            dob: row.dob,
        })
        uvidRows.push({
            LawsonId: row.lawsonId,
            LID: row.lid,
            'Legal First Name': row.firstname,
            'Legal Middle Name': '',
            'Legal Last Name': row.lastname,
            'Preferred First Name': row.firstname,
            'Preferred Last Name': row.lastname,
            UVID: row.uvid,
            groups: '',
            dob: row.dob,
        })
    }

    const accountsCsvContent = [
        Object.keys(accountRows[0])
            .map((key) => `"${key}"`)
            .join(','),
        ...accountRows.map((row) =>
            Object.values(row)
                .map((value) => `"${value}"`)
                .join(',')
        ),
    ].join('\n')
    const lidCsvContent = [
        Object.keys(lidRows[0])
            .map((key) => `"${key}"`)
            .join(','),
        ...lidRows.map((row) =>
            Object.values(row)
                .map((value) => `"${value}"`)
                .join(',')
        ),
    ].join('\n')
    const uvidCsvContent = [
        Object.keys(uvidRows[0])
            .map((key) => `"${key}"`)
            .join(','),
        ...uvidRows.map((row) =>
            Object.values(row)
                .map((value) => `"${value}"`)
                .join(',')
        ),
        ,
    ].join('\n')
    writeFileSync(join(folderPath, 'accounts.csv'), accountsCsvContent)
    writeFileSync(join(folderPath, 'lids.csv'), lidCsvContent)
    writeFileSync(join(folderPath, 'uvids.csv'), uvidCsvContent)
}

/// usage
/// generateCSV(1e5, join(__dirname, 'data'))
