<style>



</style>

<template>

<v-layout row wrap>
    <v-flex xs6 v-if="getEndpointConnectionStatus === 0 && getAccountActive && !getAccountLocked">
        <v-data-table :headers="[{
            text: 'ID',
            align: 'center',
            sortable: false
        }, {
            text: 'Players',
            align: 'center',
            sortable: false
        }, {
            text: 'Action',
            align: 'center',
            sortable: false
        }]" :items="getMatches" hide-actions class="elevation-1">
            <template slot="items" slot-scope="props">
              <td>{{ props.item.matchid }}</td>
              <td>{{ props.item.black }} | {{ props.item.white }}</td>
              <td v-if="props.item.myGame">
                <v-btn color="green" @click="$router.replace({ name: 'match', params: { id: props.item.matchid }})">Play</v-btn>
              </td>
              <td v-else>

              </td>
            </template>
        </v-data-table>
    </v-flex>

    <v-flex xs6 v-if="getEndpointConnectionStatus === 0 && getAccountActive && !getAccountLocked">
        <v-tabs v-model="matchTab" class="grey darken-3 elevation-1" dark grow icons centered>
            <v-tabs-bar>
                <v-tabs-slider color="grey"></v-tabs-slider>
                <v-tabs-item href="#add">
                    <v-icon>add</v-icon>
                    Add Match
                </v-tabs-item>
                <v-tabs-item href="#create">
                    <v-icon>create</v-icon>
                    Create Match
                </v-tabs-item>
            </v-tabs-bar>
            <v-card v-if="matchTab === 'add'">
                <v-form class="pa-4" v-model="findMatch" ref="form" lazy-validation>
                    <v-text-field label="Match ID" v-model="matchId" :rules="[
              (v) => !!v || 'Match ID is required',
              (v) => v > -1 || 'Match ID must be a number'
            ]" required></v-text-field>
                    <v-btn v-if="loading" disabled color="trasnaperent">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-btn>
                    <v-btn v-else :disabled="!findMatch" color="primary" @click="getMatch(matchId)">Add Match</v-btn>
                </v-form>
            </v-card>
            <v-card v-if="matchTab === 'addResult'">
                <v-list>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>Match ID</v-list-tile-title>
                            <v-list-tile-sub-title>{{getMatchResult.matchid}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>Status</v-list-tile-title>
                            <v-list-tile-sub-title>{{getMatchResult.statusText}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>Max move time</v-list-tile-title>
                            <v-list-tile-sub-title>{{getMatchResult.maxmoveinterval}} seconds (The time players have to make a valid move
                               before losing automatically)</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile v-if="getMatchResult.status === 1 || getMatchResult.status === 3">
                        <v-list-tile-content>
                            <v-list-tile-title>Match start</v-list-tile-title>
                            <v-list-tile-sub-title>
                                <timeago :since="unixToDatestring(this.getMatchResult.matchstart)"></timeago>
                            </v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>White</v-list-tile-title>
                            <v-list-tile-sub-title>{{getMatchResult.white}} ({{getMatchResult.moveswhite}} moves)</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>Black</v-list-tile-title>
                            <v-list-tile-sub-title>{{getMatchResult.black}} ({{getMatchResult.movesblack}} moves)</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </v-list>
                    <v-btn v-if="loading" disabled color="trasnaperent">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-btn>
                    <v-btn v-if="getMatchResult.status === 0 && getMatchResult.myGame && !loading" color="green" @click="acceptMatch(getMatchResult)">Accept Match</v-btn>
                    <v-btn v-if="getMatchResult.status === 0 && getMatchResult.myGame && !loading" color="red" @click="declineMatch(getMatchResult.matchid)">Decline Match</v-btn>
                    <v-btn v-if=" !loading" color="primary" @click="watchMatch(getMatchResult)">Watch Match</v-btn>
                    <v-btn @click="matchTab = 'add', getMatchResult = null">Back</v-btn>
            </v-card>
            <v-card v-if="matchTab === 'create'">

            </v-card>
        </v-tabs>
    </v-flex>
    <v-flex xs6 v-if="getEndpointConnectionStatus !== 0">
      <p>No connection! </br> Connection needed for Matches.</p>

      <router-link to="settings">
          <v-btn color="primary">Settings</v-btn>
      </router-link>
    </v-flex>
    <v-flex xs6 v-if="!getAccountActive">
      <p>Account needed for Matches.</p>

      <router-link to="account">
          <v-btn color="primary">Account</v-btn>
      </router-link>
    </v-flex>
    <v-flex xs6 v-else-if="getAccountLocked">
      <p>Unlocked account needed for Matches.</p>
      <p>Please unlock your account first.</p>

    </v-flex>
</v-layout>

</template>

<script>

import {
    mapGetters
}
from 'vuex'
export default {
    computed: {
        ...mapGetters([
            'getEndpointConnectionStatus',
            'getAccountActive',
            'getAccountLocked',
            'getAccountName',
            'getAccount',
            'getMatches'
        ])
    },
    data() {
        return {
            matchId: null,
            getMatchResult: null,
            findMatch: null,
            loading: null,
            matchTab: 'add',
            active: null,
            snackbar: false,
            snackbarTime: 5000,
            snackbarText: null,
            snackbarTextColor: 'white'
        }
    },
    methods: {
        getMatch(matchId) {
                this.loading = false
                this.loading = true
                this.$store.dispatch('getMatch', matchId).then((res) => {
                    if (res.rows.length >= 1) {
                      this.getMatchResult = res.rows[0]
                        if (res.rows[0].black === this.getAccount.name || res.rows[0].white === this.getAccount.name) {
                            this.getMatchResult.myGame = true
                            this.matchTab = 'addResult'
                        }
                        switch (this.getMatchResult.status) {
                            case 0:
                                this.getMatchResult.statusText = 'Match has been initiated but has not been accepted by the opponent'
                                break
                            case 1:
                                this.getMatchResult.statusText = 'Match is in progress'
                                break
                            case 2:
                                this.getMatchResult.statusText = 'Match has been declined by opponent'
                                break
                            case 3:
                                this.getMatchResult.statusText = 'Match is over'
                                break
                        }

                    } else {
                        this.getMatchResult = null
                        this.matchTab = 'add'
                        this.launchSnackbar(3000, 'Could not find a match with that ID', 'red')
                    }
                    this.loading = false
                }, (err) => {
                    alert(err.message)
                    this.getMatchResult = null
                    this.matchTab = 'add'
                    this.loading = false
                })
            },
            acceptMatch(match) {
                match.type = 0
                this.loading = false
                this.loading = true
                this.$store.dispatch('acceptMatch', match).then((res) => {
                    this.launchSnackbar(3000, 'Added match to list', 'red')
                    this.loading = false
                }, (err) => {
                  if (err.message === 'The match has already started or is over') {
                    this.launchSnackbar(3000, err.message, 'red')
                  }
                    this.loading = false
                })
            },
            watchMatch(match) {
                match.type = 1
                this.loading = false
                this.loading = true
                this.$store.dispatch('watchMatch', match).then((res) => {
                    this.launchSnackbar(3000, 'Added match to list', 'red')
                    this.loading = false
                }, (err) => {
                  if (err.message === 'The match has already started or is over') {
                    this.launchSnackbar(3000, err.message, 'red')
                  }
                    this.loading = false
                })
            },
            launchSnackbar(duration, snackbarText, snackbarTextColor) {
                this.snackbar = false
                this.snackbarTime = duration || 0
                this.snackbarText = snackbarText
                this.snackbar = true
            },
            unixToDatestring(unix) {
                return new Date(unix * 1000)
            },
            next() {
                this.active = this.tabs[(this.tabs.indexOf(this.active) + 1) % this.tabs.length]
            }
    }
}

</script>
