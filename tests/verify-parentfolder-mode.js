import fs from 'node:fs'
import path from 'node:path'

const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

async function scanParentfolders(parentFolderPaths) {
  const results = []

  for (const parentPath of parentFolderPaths) {
    const parentStat = await fs.promises.stat(parentPath)
    if (!parentStat.isDirectory()) continue

    const subEntries = await fs.promises.readdir(parentPath, { withFileTypes: true })

    for (const subEntry of subEntries) {
      if (!subEntry.isDirectory()) continue

      const subFolderPath = path.join(parentPath, subEntry.name)
      const subFolderName = subEntry.name

      const files = await fs.promises.readdir(subFolderPath, { withFileTypes: true })
      for (const fileEntry of files) {
        if (!fileEntry.isFile()) continue

        const ext = path.extname(fileEntry.name).toLowerCase()
        if (!SUPPORTED_EXTS.has(ext)) continue

        const baseName = path.basename(fileEntry.name, path.extname(fileEntry.name))
        const isPureNumber = /^\d+$/.test(baseName)
        const filePath = path.join(subFolderPath, fileEntry.name)

        let targetName = fileEntry.name
        let targetPath = filePath

        if (isPureNumber) {
          targetName = `${subFolderName}__${fileEntry.name}`
          targetPath = path.join(subFolderPath, targetName)
        }

        results.push({
          id: `${subFolderPath}::${fileEntry.name}`,
          folderPath: subFolderPath,
          folderName: subFolderName,
          fileName: fileEntry.name,
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
  }

  return results
}

async function run() {
  const base = path.resolve('tests/mock_parent/Bracelet')
  const subs = ['B0-001', 'B0-002', 'B0-003', 'B0-004']

  for (const sub of subs) {
    await fs.promises.mkdir(path.join(base, sub), { recursive: true })
  }

  await fs.promises.writeFile(path.join(base, 'B0-001/1.png'), 'p1')
  await fs.promises.writeFile(path.join(base, 'B0-001/2.png'), 'p2')
  await fs.promises.writeFile(path.join(base, 'B0-001/3.png'), 'p3')
  await fs.promises.writeFile(path.join(base, 'B0-002/1.png'), 'p1')
  await fs.promises.writeFile(path.join(base, 'B0-003/2.png'), 'p2')
  await fs.promises.writeFile(path.join(base, 'B0-004/3.png'), 'p3')
  await fs.promises.writeFile(path.join(base, 'B0-004/cover.jpg'), 'cover')

  console.log('--- 测试模式2：父文件夹扫描 ---')
  const results = await scanParentfolders([base])
  console.log(`扫描到 ${results.length} 个文件：`)
  for (const item of results) {
    console.log(`[子文件夹: ${item.folderName}] ${item.fileName} -> ${item.targetName} (纯数字: ${item.isPureNumber})`)
  }

  const pureCount = results.filter(r => r.isPureNumber).length
  if (pureCount !== 6) {
    throw new Error(`纯数字匹配数不符合预期，期望 6，实际 ${pureCount}`)
  }

  console.log('--- 执行改名 ---')
  for (const item of results) {
    if (item.checked && item.isPureNumber) {
      await fs.promises.rename(item.filePath, item.targetPath)
    }
  }

  const b001Files = await fs.promises.readdir(path.join(base, 'B0-001'))
  console.log('B0-001 最终文件:', b001Files)
  if (!b001Files.includes('B0-001__1.png') || !b001Files.includes('B0-001__2.png')) {
    throw new Error('B0-001 改名未通过')
  }

  const b004Files = await fs.promises.readdir(path.join(base, 'B0-004'))
  console.log('B0-004 最终文件:', b004Files)
  if (!b004Files.includes('B0-004__3.png') || !b004Files.includes('cover.jpg')) {
    throw new Error('B0-004 改名未通过')
  }

  console.log('🎉 模式2（父文件夹模式）单元测试全部通过！')

  // 清理临时文件
  await fs.promises.rm(path.resolve('tests/mock_parent'), { recursive: true, force: true })
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
