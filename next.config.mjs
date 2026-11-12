import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

export default phase => ({
  output: 'export',
  basePath: '/early-bird',
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
})
