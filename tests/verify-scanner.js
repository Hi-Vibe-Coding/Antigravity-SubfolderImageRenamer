import fs from 'node:fs'
import path from 'node:path'

const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

async function scanSubfolders(folderPaths) {
  const results = []
  for (const folderPath of folderPaths) {
    const folderStat = await fs.promises.stat(folderPath)
    if (!folderStat.isDirectory()) continue

    const folderName = path.basename(folderPath)
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile()) continue

      const ext = path.extname(entry.name).toLowerCase()
      if (!SUPPORTED_EXTS.has(ext)) continue

      const baseName = path.basename(entry.name, path.extname(entry.name))
      const isPureNumber = /^\d+$/.test(baseName)
      const filePath = path.join(folderPath, entry.name)

      let targetName = entry.name
      let targetPath = filePath

      if (isPureNumber) {
        targetName = `${folderName}__${entry.name}`
        targetPath = path.join(folderPath, targetName)
      }

      results.push({
        id: `${folderPath}::${entry.name}`,
        folderPath,
        folderName,
        fileName: entry.name,
        fileExt: ext,
        filePath,
        isPureNumber,
        targetName,
        targetPath,
        checked: isPureNumber,
        status: 'pending'
      })
    }
  }
  return results
}

async function run() {
  const testFolders = [
    path.resolve('tests/mock_folders/E1-013'),
    path.resolve('tests/mock_folders/E1-014')
  ]

  console.log('--- 1. 测试扫描 ---')
  const results = await scanSubfolders(testFolders)
  console.log(`扫描到 ${results.length} 个图片文件：`)
  for (const item of results) {
    console.log(`[${item.folderName}] ${item.fileName} -> ${item.isPureNumber ? item.targetName : '(保持原样)'} (纯数字: ${item.isPureNumber})`)
  }

  // 验证断言
  const pureNumCount = results.filter(r => r.isPureNumber).length
  if (pureNumCount !== 4) {
    throw new Error(`预期有 4 个纯数字文件，实际得到 ${pureNumCount}`)
  }

  console.log('--- 2. 测试重命名 ---')
  for (const item of results) {
    if (item.checked && item.isPureNumber) {
      await fs.promises.rename(item.filePath, item.targetPath)
      console.log(`成功重命名: ${item.fileName} -> ${item.targetName}`)
    }
  }

  // 检查改名后的目录
  const files1 = await fs.promises.readdir(testFolders[0])
  console.log('E1-013 目录当前文件:', files1)
  const files2 = await fs.promises.readdir(testFolders[1])
  console.log('E1-014 目录当前文件:', files2)

  if (!files1.includes('E1-013__1.png') || !files1.includes('E1-013__12.jpg') || !files1.includes('banner.png')) {
    throw new Error('E1-013 改名结果不符合预期')
  }
  if (!files2.includes('E1-014__99.png') || !files2.includes('logo.jpeg')) {
    throw new Error('E1-014 改名结果不符合预期')
  }

  console.log('所有测试用例验证通过！')
}

run().catch(err => {
  console.error('测试失败:', err)
  process.exit(1)
})
