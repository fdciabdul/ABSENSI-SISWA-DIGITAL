// scripts/generate-routes.ts
import { readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function generateRoutes() {
    const routesDir = './start/routes'

    function findRouteFiles(dir: string): string[] {
        let results: string[] = []
        const items = readdirSync(dir, { withFileTypes: true })

        for (const item of items) {
            const path = join(dir, item.name)
            if (item.isDirectory()) {
                results = results.concat(findRouteFiles(path))
            } else if (item.name === 'index.ts' && !path.includes('start/routes/index.ts')) {

                results.push(path)
            }
        }

        return results
    }

    const routeFiles = findRouteFiles(routesDir)

    const imports = routeFiles.map(file => {
        console.log(file)

        let importPath = file
            .replace(/\\/g, '/') // normalize for all OS
            .replace('start/routes/', '') // remove base
            .replace('.ts', '')

        if (importPath.startsWith('api/')) {
            return `import '#api/${importPath.substring(4)}'`
        } else if (importPath.startsWith('web/')) {
            return `import '#web/${importPath.substring(4)}'`
        }
    }).filter(Boolean).join('\n')


    const content = `
  import router from '@adonisjs/core/services/router'


// @taqin Auto-generated routes


${imports}
  `

    writeFileSync('./start/routes.ts', content)
    console.log('Routes file generated successfully!')
}