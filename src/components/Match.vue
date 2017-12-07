<style scoped>

table {
    margin: 0 auto;
    border-collapse: collapse;
    background: grey;
		width: 30%;
}
td {
	margin: 0;
	padding: 0;
}
tr:nth-child(odd) td:nth-child(even),tr:nth-child(even) td:nth-child(odd) {
    background: white;
}
.highlighted {
		outline: 1px solid green;
    outline-offset: -2px;

}
</style>

<template>

<v-layout row wrap>
<v-layout v-if="getEndpointConnectionStatus === 0 && getAccountActive && !getAccountLocked && getCurrentMatch.matchid === $route.params.id" row wrap>
	<v-flex xs12>
	<v-card >
		<p>I know nothing about chess but the contract does so let it judge your moves :)</p>
		<v-btn v-if="loading" disabled color="trasnaperent">
				<v-progress-circular indeterminate color="primary"></v-progress-circular>
		</v-btn>
		<v-btn v-if="!loading && currentMove.length > 1" color="primary" @click="sendMove()">Send move message to contract with {{currentMove.length -1}} steps</v-btn>
		<v-btn v-if="!loading && currentMove.length > 1" color="red" @click="cancelMove()">Cancel current move</v-btn>
		<v-btn v-else disabled >Send move message to contract</v-btn>
	</v-card>
</v-flex>
    <v-flex xs8>

	<table id="board" ref="board" v-bind:style="{ height: boardWidth + 'px !important' }">
	<tr>
		<td v-for="(item, index) in getRowFromBoard(0,0)" v-html="item" @click="highlight($event)" :class="['0-' + index]">
  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(1,8)" v-html="item" @click="highlight($event)" :class="['1-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(2,16)" v-html="item" @click="highlight($event)" :class="['2-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(3,24)" v-html="item" @click="highlight($event)" :class="['3-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(4,32)" v-html="item" @click="highlight($event)" :class="['4-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(5,40)" v-html="item" @click="highlight($event)" :class="['5-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(6,48)" v-html="item" @click="highlight($event)" :class="['6-' + index]">

  </td>
	</tr>
	<tr>
		<td v-for="(item, index) in getRowFromBoard(7,56)" v-html="item" @click="highlight($event)" :class="['7-' + index]">

  </td>
	</tr>
</table>
    </v-flex>
		<v-flex xs4>
			<v-card>
	<v-list two-line dense>
			Game Info
			<v-divider></v-divider>
			<v-list-tile>
				<v-list-tile-content>
					<v-list-tile-title>Last move</v-list-tile-title>
					<v-list-tile-sub-title><timeago :since="unixToDatestring(getCurrentMatch.lastmovetime)" :auto-update="5"></timeago> by {{moveSide(getCurrentMatch.lastmoveside)}}</v-list-tile-sub-title>
				</v-list-tile-content>
			</v-list-tile>
			<v-list-tile>
				<v-list-tile-content>
					<v-list-tile-title>Time left for next move</v-list-tile-title>
					<v-list-tile-sub-title>{{(getCurrentMatch.lastmovetime + getCurrentMatch.maxmoveinterval) - Math.round(new Date().getTime() / 1000)}} seconds</v-list-tile-sub-title>
				</v-list-tile-content>
			</v-list-tile>
			<v-list-tile>
				<v-list-tile-content>
					<v-list-tile-title>White</v-list-tile-title>
					<v-list-tile-sub-title>{{getCurrentMatch.white}} || {{getCurrentMatch.moveswhite}} move(s)</v-list-tile-sub-title>
				</v-list-tile-content>
			</v-list-tile>
			<v-list-tile>
				<v-list-tile-content>
					<v-list-tile-title>Black</v-list-tile-title>
					<v-list-tile-sub-title>{{getCurrentMatch.black}} || {{getCurrentMatch.movesblack}} move(s)</v-list-tile-sub-title>
				</v-list-tile-content>
			</v-list-tile>
	</v-list>
</v-card>
		</v-flex>

</v-layout>

    <v-flex xs6 v-if="getEndpointConnectionStatus !== 0">
        <p>No connection! </br> Connection needed for Match.</p>

        <router-link to="settings">
            <v-btn color="primary">Settings</v-btn>
        </router-link>
    </v-flex>
    <v-flex xs6 v-if="!getAccountActive">
        <p>Account needed for Match.</p>

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
            'getMatches',
            'getCurrentMatch'
        ])
		},
    data() {
        return {
						currentMove: [],
						boardWidth: 0,
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
						highlight (event) {
							event.currentTarget.classList.add('highlighted')
							let piece = event.currentTarget.className.split(' ')[0]
							let exists = this.currentMove.indexOf(piece)
							if (exists === -1) {
								this.currentMove.push(piece)
							}
						},
						cancelMove () {
							var els = document.getElementsByClassName('highlighted')
							while (els[0]) {
    						els[0].classList.remove('highlighted')
  						}
							this.currentMove = []
						},
						sendMove () {
							this.loading = true
							let formatted = []
							for (let i = 0;i < this.currentMove.length;i++) {
								formatted.push(Number(this.currentMove[i].split('-')[0]))
								formatted.push(Number(this.currentMove[i].split('-')[1]))
							}
							formatted.push(10)
							let rem = 16 -formatted.length
							for (let j = 0;j < rem;j++) {
								formatted.push(0)
							}
							this.$store.dispatch('sendMove', {steps: formatted, matchid: this.getCurrentMatch.matchid}).then((res) => {
								this.loading = false
								this.currentMove = []
								this.cancelMove()
								alert('contract says: good')
							}, (err) => {
								this.loading = false
								this.currentMove = []
								this.cancelMove()
								alert('contract says: ' + err.message)
							})
						},
						getRowFromBoard(row,from){
							let nArr = []
							for(let i = from;i < from + 8;i++) {
								let str = '<img @click="highlight" src="https://raw.githubusercontent.com/nanonano7/eoschess-ui/master/docs/static/pieces/p' + this.getCurrentMatch.board[i] + '.svg">'
								nArr.push(str)
							}
							return nArr
						},
						moveSide(s) {
							if (s === 0) {
								return 'white'
							} else {
								return 'black'
							}
						},
						calculateHeight() {
								this.boardWidth = this.$refs.board.clientWidth;
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
    },
    mounted() {
        this.$store.dispatch('setCurrentMatch', this.$route.params.id)
				window.addEventListener('resize', this.calculateHeight)
    }
}

</script>
