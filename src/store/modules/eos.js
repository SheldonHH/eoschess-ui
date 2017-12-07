import Eos from 'eosjs'
// import val from 'validator'

const state = {
  eosconfig: {
    httpEndpoint: 'https://testnet1.eos.io:443',
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    mode: 'no-cors'
  },
  connectionTimeout: 5000,
  getInfo: null,
  endpoints: [
    {url: 'https://testnet1.eos.io:443', ping: 0, lastConnection: 0}
  ],
  currentEndpoint: {url: 'https://testnet1.eos.io:443', ping: 0, lastConnection: 0},
  endpointConnectionStatus: 10,
  endpointRefreshInterval: 5000,
  myMatches: [],
  currentMatch: null
}

const mutations = {
  UPDATE_MATCH (state, umatch) {
    let findMatch = state.myMatches.find(findMatch => {
      return findMatch.matchid === umatch.matchid
    })
    if (findMatch) {
      findMatch = Object.assign(findMatch, umatch)
    }
  },
  SET_MATCH (state, matchid) {
    let findMatch = state.myMatches.find(findMatch => {
      return findMatch.matchid === matchid
    })
    if (findMatch) {
      state.currentMatch = findMatch
    }
  },
  WATCH_MATCH (state, match) {
    if (match) {
      let findMatch = state.myMatches.find(findMatch => {
        return findMatch.matchid === match.matchid
      })
      if (!findMatch) {
        state.myMatches.push(match)
      }
    }
  },
  UPDATE_MATCHES (state, matches) {
    for (let i = 0; i < state.myMatches.length; i++) {
      let findMatch = state.myMatches.find(findMatch => {
        return findMatch.matchid === matches[i].matchid
      })
      if (findMatch) {
        findMatch = Object.assign(findMatch, matches[i])
      }
    }
  },
  ADD_MATCH (state, match) {
    state.myMatches.push(match)
  },
  PING_ENDPOINT_SUCCESS (state, payload) {
    state.currentEndpoint.ping = payload.ping
    state.endpointConnectionStatus = 0
    state.currentEndpoint.lastConnection = Math.round(new Date().getTime() / 1000)
    state.getInfo = payload.getInfo
    let current = state.endpoints.find(current => {
      return current.url === state.currentEndpoint.url
    })
    current.ping = payload.ping
    current.lastConnection = Math.round(new Date().getTime() / 1000)
  },
  PING_ENDPOINT_FAIL (state) {
    state.endpointConnectionStatus = 1
  },
  DISCONNECT_ENDPOINT (state) {
    state.endpointConnectionStatus = 1
    state.currentEndpoint = null
    state.eosconfig.httpEndpoint = ''
  },
  USE_ENDPOINT (state, endpoint) {
    state.currentEndpoint = endpoint
    state.eosconfig.httpEndpoint = state.currentEndpoint.url
  },
  ADD_ENDPOINT (state, endpoint) {
    state.endpoints.push({url: endpoint, ping: 0, lastConnection: 0})
  },
  REMOVE_ENDPOINT (state, endpoint, active) {
    let removeEndpoint = state.endpoints.map(function (item) { return item.url }).indexOf(endpoint.url)
    state.endpoints.splice(removeEndpoint, 1)
    if (active) {
      state.currentEndpoint = null
      state.eosconfig.httpEndpoint = ''
    }
  }
}

const actions = {
  pingEndpoint ({ commit, state }) {
    return new Promise((resolve, reject) => {
      if (state.currentEndpoint !== null) {
        var eos = Eos.Testnet(state.eosconfig)
        var pingStart = new Date().getTime()
        var timeout = setTimeout(function () { reject(Error('timeout')) }, state.connectionTimeout)
        eos.getInfo({}).then((res) => {
          clearTimeout(timeout)
          var ping = new Date().getTime() - pingStart
          commit('PING_ENDPOINT_SUCCESS', {getInfo: res, ping: ping})
          resolve(res)
        }, (err) => {
          clearTimeout(timeout)
          if (err) {
            commit('PING_ENDPOINT_FAIL')
            reject(Error('failed'))
          }
        })
      } else {
        commit('PING_ENDPOINT_FAIL')
        reject(Error('noEnpoint'))
      }
    })
  },
  useEndpoint ({ commit, state, dispatch }, endpoint) {
    return new Promise((resolve, reject) => {
      let find = state.endpoints.find(find => {
        return find.url === endpoint
      })
      if (find) {
        commit('DISCONNECT_ENDPOINT')
        commit('USE_ENDPOINT', find)
        dispatch('pingEndpoint').then((res) => {
          resolve()
        }, (err) => {
          if (err) {
            commit('DISCONNECT_ENDPOINT')
            reject(err)
          }
        })
      }
    })
  },
  findAccount ({ commit, state }, account) {
    return new Promise((resolve, reject) => {
      var eos = Eos.Testnet(state.eosconfig)
      eos.getAccount({account_name: account}).then((res) => {
        resolve(res)
      }, (err) => {
        if (err) {
          reject(Error('notFound'))
        }
      })
    })
  },
  disconnectEndpoint ({ commit, state }) {
    return new Promise((resolve, reject) => {
      commit('DISCONNECT_ENDPOINT')
      resolve()
    })
  },
  addEndpoint ({ commit, state }, endpoint) {
    return new Promise((resolve, reject) => {
      let find = state.endpoints.find(find => {
        return find.url === endpoint
      })
      if (find) {
        reject(Error())
      } else {
        commit('ADD_ENDPOINT', endpoint)
        resolve()
      }
    })
  },
  removeEndpoint ({ commit, state }, endpoint) {
    return new Promise((resolve, reject) => {
      let find = state.endpoints.find(find => {
        return find.url === endpoint
      })
      if (find) {
        if (state.currentEndpoint && find.url === state.currentEndpoint.url) {
          commit('REMOVE_ENDPOINT', find, true)
        } else {
          commit('REMOVE_ENDPOINT', find, false)
        }
        resolve()
      }
    })
  },
  getMatch ({ commit, state }, matchid) {
    return new Promise((resolve, reject) => {
      let parameters = { json: true, scope: 'chess', code: 'chess', table: 'matches', limit: 1, lower_bound: matchid }
      var eos = Eos.Testnet(state.eosconfig)
      eos.getTableRows(parameters).then((res) => {
        resolve(res)
      }, (err) => {
        if (err) {
          reject(err)
        }
      })
    })
  },
  setCurrentMatch ({ commit, state }, matchid) {
    return new Promise((resolve, reject) => {
      commit('SET_MATCH', matchid)
      resolve()
    })
  },
  addMatch ({ commit, state }, match) {
    commit('EXTEND_UNLOCK')
    return new Promise((resolve, reject) => {
      match.lastUpdate = 0
      commit('ADD_MATCH', match)
      resolve()
    })
  },
  updateMatch ({ commit, state, dispatch }, matchid) {
    return new Promise((resolve, reject) => {
      dispatch('getMatch', matchid).then((res) => {
        commit('UPDATE_MATCH', res.rows[0])
        resolve()
      })
    })
  },
  updateMatches ({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      let gatheredMatches = []
      loopi(0)
      function loopi (i) {
        let l = state.myMatches.length
        if (i < l) {
          if (state.myMatches[i].status === 0 || state.myMatches[i].status === 1) {
            dispatch('getMatch', state.myMatches[i].matchid).then((res) => {
              gatheredMatches.push(res.rows[0])
              i++
              loopi(i)
            })
          }
        } else if (i >= l) {
          commit('UPDATE_MATCHES', gatheredMatches)
          resolve()
        }
      }
    })
  },
  watchMatch ({ commit, state }, match) {
    return new Promise((resolve, reject) => {
      commit('WATCH_MATCH', match)
      resolve()
    })
  },
  acceptMatch ({ commit, state, rootState }, match) {
    commit('EXTEND_UNLOCK')
    return new Promise((resolve, reject) => {
      var conf = Object.assign({}, state.eosconfig)
      conf.keyProvider = rootState.wallet.privateKey
      conf.authorization = rootState.wallet.wallet.name + '@active'
      conf.scope = ['chess', rootState.wallet.wallet.name]
      var eos = Eos.Testnet(conf)
      eos.contract('chess').then(chess => {
        eos.transaction({
          scope: ['chess', rootState.wallet.wallet.name],
          messages: [
            {
              code: 'chess',
              type: 'acceptmatch',
              authorization: [{
                account: rootState.wallet.wallet.name,
                permission: 'active'
              }],
              data: {
                matchid: match.matchid,
                accept: 1,
                player: rootState.wallet.wallet.name
              }
            }
          ]
        }).then((res) => {
          commit('ADD_MATCH', match)
          resolve(res)
        }, (err) => {
          if (JSON.parse(err).details.slice(0, 2) === '10') {
            let details = JSON.parse(err).details
            let errString1 = details.substring(details.lastIndexOf('{"s":"') + 1, details.lastIndexOf('","ptr"'))
            let errString = errString1.split('"')[3]
            reject(Error(errString))
          } else {
            reject(err)
          }
        })
      })
    })
  },
  sendMove ({ commit, state, rootState, dispatch }, moveObj) {
    return new Promise((resolve, reject) => {
      var conf = Object.assign({}, state.eosconfig)
      conf.keyProvider = rootState.wallet.privateKey
      conf.authorization = rootState.wallet.wallet.name + '@active'
      conf.scope = ['chess', rootState.wallet.wallet.name]
      var eos = Eos.Testnet(conf)
      eos.contract('chess').then(chess => {
        eos.transaction({
          scope: ['chess', rootState.wallet.wallet.name],
          messages: [
            {
              code: 'chess',
              type: 'movepiece',
              authorization: [{
                account: rootState.wallet.wallet.name,
                permission: 'active'
              }],
              data: {
                matchid: moveObj.matchid,
                player: rootState.wallet.wallet.name,
                steps: moveObj.steps
              }
            }
          ]
        }).then((res) => {
          dispatch('updateMatch')
          resolve(res)
        }, (err) => {
          if (JSON.parse(err).details.slice(0, 2) === '10') {
            let details = JSON.parse(err).details
            let errString1 = details.substring(details.lastIndexOf('{"s":"') + 1, details.lastIndexOf('","ptr"'))
            let errString = errString1.split('"')[3]
            reject(Error(errString))
          } else {
            reject(err)
          }
        })
      })
    })
  }
}

const getters = {
  getEndpoints: state => {
    if (state.endpoints.length > 0) {
      return state.endpoints
    } else {
      return []
    }
  },
  getCurrentEndpoint: state => {
    return state.currentEndpoint
  },
  getMatches: state => {
    return state.myMatches
  },
  getCurrentMatch: state => {
    return state.currentMatch
  },
  getMatchesCount: state => {
    return state.myMatches.length
  },
  getEndpointConnectionStatus: state => {
    return state.endpointConnectionStatus
  },
  getEndpointRefreshInterval: state => {
    return state.endpointRefreshInterval
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
