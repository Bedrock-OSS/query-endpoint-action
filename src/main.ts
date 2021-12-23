/* eslint-disable i18n-text/no-en */
import * as core from '@actions/core'
import * as gh from '@actions/github'
// import http from 'http'
import FormData from 'form-data'

async function run(): Promise<void> {
  try {
    const host: string = core.getInput('hostname')
    const port: string = core.getInput('port')
    // const path: string = core.getInput('path')
    const waitTime = Number(core.getInput('queryInterval'))
    const auth: string = core.getInput('auth')
    const timeout: number = Number(core.getInput('timeout')) * 1000
    const startTime = Date.now()
    core.info(`Starting! Job is running`)
    core.debug(
      `Inputs: webhook: ${host}:${port}, queryInterval: ${waitTime}, timeout: ${timeout}`
    )
    core.debug(`Sending request at ${new Date().toTimeString()}...`)
    const form = new FormData()
    form.append('id', `${gh.context.repo.owner}:${gh.context.repo.repo}`)
    form.append('secret', auth)
    await new Promise<void>(r => {
      form.submit(`http://${host}:${port}/deploy`, (err, res) => {
        if (err) {
          if (err.message.includes('ECONNREFUSED')) {
            r()
            return
          }
          throw err
        }
        res.resume()
        core.debug(`Got response code ${res.statusCode}`)
        if (res.statusCode === 400) {
          core.setFailed('The authorization token is invalid')
        } else if (res.statusCode === 500) {
          let allData = ''
          res.on('data', chunk => {
            allData += chunk
          })
          res.on('end', () => {
            core.setFailed(`Error from server: ${allData}`)
          })
        } else if (res.statusCode !== 299 && res.statusCode !== 202) {
          let allData = ''
          res.on('data', chunk => {
            allData += chunk
          })
          res.on('end', () => {
            core.setFailed(
              `Error unrecognized code ${res.statusCode}: ${allData}`
            )
          })
        }
        r()
      })
    })
    let trying = true
    while (trying) {
      try {
        core.debug(`Sending request at ${new Date().toTimeString()}...`)
        const form2 = new FormData()
        form2.append('id', `${gh.context.repo.owner}:${gh.context.repo.repo}`)
        form2.append('secret', auth)
        await new Promise<void>(r => {
          form2.submit(`http://${host}:${port}/status`, (err, res) => {
            if (err) {
              if (err.message.includes('ECONNREFUSED')) {
                r()
                return
              }
              throw err
            }
            res.resume()
            core.debug(`Got response code ${res.statusCode}`)
            let allData = ''
            res.on('data', chunk => {
              allData += chunk
            })
            res.on('end', () => {
              if (allData.toLowerCase().includes('error')) {
                trying = false
                core.setFailed(`Error from server: ${allData}`)
                r()
                return
              } else if (
                allData.toLowerCase().includes('running') ||
                allData.toLowerCase().includes('stopped')
              ) {
                trying = false
                core.info(`Success! Job is done`)
                r()
                return
              } else if (!allData.toLowerCase().includes('processing')) {
                trying = false
                core.setFailed(`Error unrecognized status: ${allData}`)
                r()
                return
              }
              r()
            })
          })
        })
      } catch (e) {
        core.setFailed(`Failed to send webhook request: ${e}`)
        trying = false
      }
      if (Date.now() - timeout > startTime) break
      if (!trying) break
      await new Promise(r => setTimeout(r, waitTime))
    }
    if (trying) {
      // Failed due to timeout
      core.setFailed('Timed out waiting for successful response')
    } else {
      // Success
      core.info(`Got 200 at ${new Date().toTimeString()}`)
      core.setOutput('time', new Date().toTimeString())
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
