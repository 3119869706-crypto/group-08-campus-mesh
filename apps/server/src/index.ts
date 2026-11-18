import { buildApp } from './app'

const port = Number(process.env.PORT ?? 3000)
const app = buildApp()

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    console.log(`CampusMesh server listening on http://localhost:${port}`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
