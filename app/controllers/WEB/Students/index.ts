import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import Class from '#models/class'
import FingerprintDevice from '#models/fingerprint_device'
import app from '@adonisjs/core/services/app'
import fs from 'fs/promises'
import XLSX from 'xlsx' // Ensure you have installed xlsx package
export default class StudentsController {
    async index({ view, request }: HttpContext) {
        const page = request.input('page', 1)
        const search = request.input('search', '')
        const classFilter = request.input('class', '')
        const status = request.input('status', '')

        let query = Student.query()
            .preload('class', (classQuery) => {
                classQuery.preload('teacher')
            })

        if (search) {
            query = query.where((builder) => {
                builder
                    .where('name', 'LIKE', `%${search}%`)
                    .orWhere('studentId', 'LIKE', `%${search}%`)
                    .orWhere('email', 'LIKE', `%${search}%`)
            })
        }

        if (classFilter) {
            query = query.where('classId', classFilter)
        }

        if (status === 'active') {
            query = query.where('isActive', true)
        } else if (status === 'inactive') {
            query = query.where('isActive', false)
        }

        const students = await query
            .orderBy('name', 'asc')
            .paginate(page, 10)

        students.baseUrl('/students')

        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')

        return view.render('pages/students/index', {
            students,
            classes,
            search,
            classFilter,
            status
        })
    }
    async apiIndex({ request, response }: HttpContext) {
        const students = await Student.query()
            .preload('class')
            .where('isActive', true)
            .orderBy('name', 'asc')

        return response.json({
            data: students.map(student => ({
                id: student.id,
                studentId: student.studentId,
                name: student.name,
                email: student.email,
                phone: student.phone || '-',
                className: student.class.name,
                gradeLevel: student.gradeLevel,
                status: student.isActive ? 'Aktif' : 'Tidak Aktif',
                isActive: student.isActive
            }))
        })
    }
    async create({ view }: HttpContext) {
        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')

        return view.render('pages/students/create', { classes })
    }

    async store({ request, response, session }: HttpContext) {
        const data = request.only([
            'studentId',
            'name',
            'email',
            'phone',
            'classId',
            'gradeLevel'
        ])

        try {
            await Student.create({
                ...data,
                isActive: true
            })

            session.flash('success', 'Data siswa berhasil ditambahkan')
            return response.redirect().toRoute('students.index')
        } catch (error) {
            session.flash('error', 'Gagal menambahkan data siswa')
            return response.redirect().back()
        }
    }

async show({ params, view }: HttpContext) {
    const student = await Student.query()
        .where('id', params.id)
        .preload('class', (classQuery) => {
            classQuery.preload('teacher')
        })
        .preload('attendances', (attendanceQuery) => {
            attendanceQuery
                .preload('schedule', (scheduleQuery) => {
                    scheduleQuery.preload('class')
                })
                .whereNotNull('scheduleId')
                .orderBy('attendanceDate', 'desc')
                .limit(10)
        })
        .preload('fingerprints', (fingerprintQuery) => {
            fingerprintQuery.where('isActive', true).orderBy('createdAt', 'desc')
        })
        .preload('faceData', (faceDataQuery) => {
            faceDataQuery.orderBy('createdAt', 'desc')
        })
        .firstOrFail()

    const devices = await FingerprintDevice.query()
        .where('isActive', true)
        .where('isOnline', true)
        .orderBy('deviceName', 'asc')

    return view.render('pages/students/show', { student, devices })
}

    async edit({ params, view }: HttpContext) {
        const student = await Student.query()
            .where('id', params.id)
            .preload('class', (classQuery) => {
                classQuery.preload('teacher')
            })
            .firstOrFail()

        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')

        return view.render('pages/students/edit', { student, classes })
    }
    async update({ params, request, response, session }: HttpContext) {
        const student = await Student.findOrFail(params.id)
        const data = request.only([
            'studentId',
            'name',
            'email',
            'phone',
            'classId',
            'gradeLevel',
            'isActive'
        ])

        try {
            await student.merge(data).save()
            session.flash('success', 'Data siswa berhasil diperbarui')
            return response.redirect().toRoute('students.index')
        } catch (error) {
            session.flash('error', 'Gagal memperbarui data siswa')
            return response.redirect().back()
        }
    }

    async destroy({ params, response, session }: HttpContext) {
        try {
            const student = await Student.findOrFail(params.id)
            await student.delete()

            session.flash('success', 'Data siswa berhasil dihapus')
            return response.redirect().toRoute('students.index')
        } catch (error) {
            session.flash('error', 'Gagal menghapus data siswa')
            return response.redirect().back()
        }
    }


    async import({ request, response, session }: HttpContext) {
    try {
        const file = request.file('file', {
            size: '10mb',
            extnames: ['xlsx', 'xls']
        })

        if (!file) {
            return response.json({ success: false, message: 'File tidak ditemukan' })
        }
        const uploadDir = app.makePath('public/uploads/template')
        
        try {
            await fs.access(uploadDir)
        } catch {
            await fs.mkdir(uploadDir, { recursive: true })
        }
        
        // Move file to temp location
        await file.move(uploadDir)

        // Read Excel file (you'll need to install xlsx package)
        // npm install xlsx @types/xlsx
     
        if (!file.filePath) {
            return response.json({ success: false, message: 'File path tidak ditemukan' })
        }
        const workbook = XLSX.readFile(file.filePath)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        let imported = 0
        let errors = []

        for (const row of data) {
            try {
                const studentRow = row as {
                    NIS?: string
                    ['Nama Lengkap']?: string
                    Email?: string
                    Telepon?: string
                    Kelas?: string
                    Tingkat?: string | number
                }
                // Validate required fields
                if (!studentRow.NIS || !studentRow['Nama Lengkap'] || !studentRow.Email || !studentRow.Kelas || !studentRow.Tingkat) {
                    errors.push(`Baris ${data.indexOf(row) + 2}: Data tidak lengkap`)
                    continue
                }

                // Check if class exists
                const classData = await Class.query()
                    .where('name', studentRow.Kelas)
                    .where('gradeLevel', studentRow.Tingkat.toString())
                    .first()

                if (!classData) {
                    errors.push(`Baris ${data.indexOf(row) + 2}: Kelas ${studentRow.Kelas} tidak ditemukan`)
                    continue
                }

                // Create student
                await Student.create({
                    studentId: studentRow.NIS,
                    name: studentRow['Nama Lengkap'],
                    email: studentRow.Email,
                    phone: studentRow.Telepon || null,
                    classId: classData.id,
                    gradeLevel: studentRow.Tingkat.toString(),
                    isActive: true
                })

                imported++
            } catch (error) {
                errors.push(`Baris ${data.indexOf(row) + 2}: ${error.message}`)
            }
        }

        // Clean up temp file
        if (file.filePath) {
            await fs.unlink(file.filePath)
        }

        if (imported > 0) {
            session.flash('success', `Berhasil mengimpor ${imported} data siswa`)
            return response.json({ 
                success: true, 
                imported, 
                errors: errors.length > 0 ? errors : null 
            })
        } else {
            return response.json({ 
                success: false, 
                message: 'Tidak ada data yang berhasil diimpor',
                errors 
            })
        }
     } catch (error) {
        return response.json({ 
            success: false, 
            message: `Terjadi kesalahan: ${error.message}` 
        })
    }
}

async downloadTemplate({ response }: HttpContext) {
    try {
 
        
        // Get active classes for template
        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')
        
        // Create template data with examples
        const templateData = [
            ['NIS', 'Nama Lengkap', 'Email', 'Telepon', 'Kelas', 'Tingkat'],
            ['2024001', 'Ahmad Rizki Pratama', 'ahmad.rizki@student.com', '081234567890', '10A', '10'],
            ['2024002', 'Siti Nurhaliza', 'siti.nurhaliza@student.com', '081234567891', '10B', '10'],
            ['2024003', 'Budi Santoso', 'budi.santoso@student.com', '081234567892', '11A', '11']
        ]
        
        // Create instructions sheet
        const instructionsData = [
            ['PETUNJUK PENGGUNAAN TEMPLATE DATA SISWA'],
            [''],
            ['1. Format File:'],
            ['   - Gunakan format .xlsx atau .xls'],
            ['   - Jangan mengubah nama kolom di baris pertama'],
            ['   - Hapus baris contoh sebelum mengisi data'],
            [''],
            ['2. Kolom yang Wajib Diisi:'],
            ['   - NIS: Nomor Induk Siswa (harus unik)'],
            ['   - Nama Lengkap: Nama siswa'],
            ['   - Email: Alamat email (harus unik)'],
            ['   - Kelas: Nama kelas yang sudah terdaftar'],
            ['   - Tingkat: 10, 11, atau 12'],
            [''],
            ['3. Kolom Opsional:'],
            ['   - Telepon: Nomor telepon siswa'],
            [''],
            ['4. Kelas yang Tersedia:'],
            ...classes.map(c => [`   - ${c.name} (Tingkat ${c.gradeLevel})`]),
            [''],
            ['5. Contoh Data:'],
            ['   - Lihat sheet "Template Data Siswa"'],
            [''],
            ['6. Catatan Penting:'],
            ['   - NIS dan Email harus unik'],
            ['   - Kelas harus sudah terdaftar di sistem'],
            ['   - Data yang error akan dilewati']
        ]

        // Create workbook
        const workbook = XLSX.utils.book_new()
        
        // Add template sheet
        const templateSheet = XLSX.utils.aoa_to_sheet(templateData)
        XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Data Siswa')
        
        // Add instructions sheet
        const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Petunjuk Penggunaan')
        
        // Style the template sheet
        const range = XLSX.utils.decode_range(templateSheet['!ref'] ?? 'A1:A1')
        for (let col = range.s.c; col <= range.e.c; col++) {
            const headerCell = XLSX.utils.encode_cell({r: 0, c: col})
            if (templateSheet[headerCell]) {
                templateSheet[headerCell].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "366092" } },
                    alignment: { horizontal: "center" }
                }
            }
        }
        
        // Set column widths
        templateSheet['!cols'] = [
            { width: 15 }, // NIS
            { width: 25 }, // Nama
            { width: 30 }, // Email
            { width: 15 }, // Telepon
            { width: 10 }, // Kelas
            { width: 10 }  // Tingkat
        ]
        
        // Generate file
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        
        response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response.header('Content-Disposition', 'attachment; filename="template-data-siswa.xlsx"')
        
        return response.send(buffer)
    } catch (error) {
        return response.status(500).json({ 
            success: false, 
            message: `Gagal membuat template: ${error.message}` 
        })
    }
}
}