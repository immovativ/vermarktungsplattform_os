// / <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

import axios from "axios"
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import cypressFailFast from "cypress-fail-fast/plugin";

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  cypressFailFast(on, config);
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  on('task', {
    async httpGet<T = any>({url, config}: any): Promise<T> {
      return (await client.get(url, config)).data
    },

    async httpDelete<T = any>({url, config}: any): Promise<T> {
      return (await client.delete(url, config)).data
    },

    async httpPost<T = any>({url, data, config}: any): Promise<T> {
      return (await client.post<T>(url, data, config)).data
    },

    async httpPut<T = any>({url, data, config}: any): Promise<T> {
      return (await client.put<T>(url, data, config)).data
    }
  })
}
