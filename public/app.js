const form = document.querySelector('#repair-form')
const runButton = form.querySelector('.run-button')
const emptyOutput = document.querySelector('#empty-output')
const skeletonOutput = document.querySelector('#skeleton-output')
const repairOutput = document.querySelector('#repair-output')
const copyButton = document.querySelector('#copy-button')
const errorMessage = document.querySelector('#form-error')
const sampleButton = document.querySelector('#sample-button')

let latestReport = ''

const escapeHtml = (value) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character])

const renderInline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const renderMarkdown = (markdown) => {
  const codeBlocks = []
  const protectedMarkdown = markdown.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const index = codeBlocks.push(`<pre><code data-language="${escapeHtml(language.trim())}">${escapeHtml(code.trim())}</code></pre>`) - 1
    return `\n@@CODE${index}@@\n`
  })

  const lines = protectedMarkdown.split('\n')
  let html = ''
  let listType = null

  const closeList = () => {
    if (listType) html += `</${listType}>`
    listType = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const codeMatch = line.match(/^@@CODE(\d+)@@$/)
    const headingMatch = line.match(/^##\s+(.+)/)
    const orderedMatch = line.match(/^\d+\.\s+(.+)/)
    const unorderedMatch = line.match(/^[-*]\s+(.+)/)

    if (codeMatch) {
      closeList()
      html += codeBlocks[Number(codeMatch[1])]
    } else if (headingMatch) {
      closeList()
      html += `<h2>${renderInline(headingMatch[1])}</h2>`
    } else if (orderedMatch) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol' }
      html += `<li>${renderInline(orderedMatch[1])}</li>`
    } else if (unorderedMatch) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul' }
      html += `<li>${renderInline(unorderedMatch[1])}</li>`
    } else if (line.trim()) {
      closeList()
      html += `<p>${renderInline(line)}</p>`
    } else {
      closeList()
    }
  }

  closeList()
  return html
}

const setLoading = (loading) => {
  runButton.disabled = loading
  runButton.classList.toggle('loading', loading)
  emptyOutput.hidden = loading || Boolean(latestReport)
  skeletonOutput.hidden = !loading
  repairOutput.hidden = loading || !latestReport
}

sampleButton.addEventListener('click', () => {
  document.querySelector('#goal').value = 'The production build should resolve the shared StatusPill component using the existing @ alias.'
  document.querySelector('#evidence').value = `$ npm run build\n\n> vite build\n[vite]: Rollup failed to resolve import "@/components/StatusPill" from "src/views/Dashboard.tsx".\n\nvite.config.ts\n----------------\nexport default defineConfig({\n  plugins: [react()],\n})\n\ntsconfig.json\n-------------\n{\n  "compilerOptions": {\n    "paths": { "@/*": ["./src/*"] }\n  }\n}\n\nsrc/views/Dashboard.tsx\n-----------------------\nimport { StatusPill } from '@/components/StatusPill'`
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorMessage.textContent = ''
  latestReport = ''
  copyButton.disabled = true
  setLoading(true)

  const formData = new FormData(form)
  const payload = Object.fromEntries(formData.entries())

  try {
    const response = await fetch('/api/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Unable to generate a repair report.')

    latestReport = data.repair
    repairOutput.innerHTML = renderMarkdown(latestReport)
    copyButton.disabled = false
  } catch (error) {
    errorMessage.textContent = error.message
    emptyOutput.hidden = false
  } finally {
    setLoading(false)
  }
})

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(latestReport)
    copyButton.textContent = 'Copied'
    window.setTimeout(() => { copyButton.textContent = 'Copy report' }, 1600)
  } catch {
    copyButton.textContent = 'Copy failed'
  }
})
