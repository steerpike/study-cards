import Vue from 'vue'
import Vuex from 'vuex'
const fb = require('./firebaseConfig.js')

Vue.use(Vuex)

fb.auth.onAuthStateChanged(user => {
    if (user) {
        store.commit('setCurrentUser', user)
        store.dispatch('fetchUserProfile')

        fb.usersCollection.doc(user.uid).onSnapshot(doc => {
            store.commit('setUserProfile', doc.data())
        })
        // realtime updates from our questions collection
        fb.questionsCollection.orderBy('createdOn', 'desc').onSnapshot(querySnapshot => {
            // check if created by currentUser
            let createdByCurrentUser
            if (querySnapshot.docs.length) {
                createdByCurrentUser = store.state.currentUser.uid == querySnapshot.docChanges()[0].doc.data().userId ? true : false 
            }
            // add new questions to hiddenQuestions array after initial load
            if (querySnapshot.docChanges().length !== querySnapshot.docs.length
                && querySnapshot.docChanges()[0].type == 'added' && !createdByCurrentUser) {

                let question = querySnapshot.docChanges()[0].doc.data()
                question.id = querySnapshot.docChanges()[0].doc.id

                store.commit('setHiddenQuestions', question)
            } else {
                let questionsArray = []

                querySnapshot.forEach(doc => {
                    let question = doc.data()
                    question.id = doc.id
                    questionsArray.push(question)
                })

                store.commit('setQuestions', questionsArray)
            }
        })
    }
})

export const store = new Vuex.Store({
    state: {
        currentUser: null,
        userProfile: {},
        questions: [],
        hiddenQuestions: []
    },
    actions: {
        clearData({ commit }) {
            commit('setCurrentUser', null)
            commit('setUserProfile', [])
            commit('setQuestions', null)
            commit('setHiddenQuestions', null)
        },
        fetchUserProfile({ commit, state }) {
            fb.usersCollection.doc(state.currentUser.uid).get().then(res => {
                commit('setUserProfile', res.data())
            }).catch(err => {
                console.log(err)
            })
        },
        updateProfile({ commit, state }, data) {
            let name = data.name
            let title = data.title
        
            fb.usersCollection.doc(state.currentUser.uid).update({ name, title }).then(user => {
                // update all questions by user to reflect new name
                fb.questionsCollection.where('userId', '==', state.currentUser.uid).get().then(docs => {
                    docs.forEach(doc => {
                        fb.questionsCollection.doc(doc.id).update({
                            userName: name
                        })
                    })
                })
                // update all answers by user to reflect new name
                fb.answersCollection.where('userId', '==', state.currentUser.uid).get().then(docs => {
                    docs.forEach(doc => {
                        fb.answersCollection.doc(doc.id).update({
                            userName: name
                        })
                    })
                })
            }).catch(err => {
                console.log(err)
            })
        }
    }, 
    mutations: {
        setCurrentUser(state, val) {
            state.currentUser = val
        },
        setUserProfile(state, val) {
            state.userProfile = val
        },
        setQuestions(state, val) {
            if (val) {
                state.questions = val
            } else {
                state.questions = []
            }
        },
        setHiddenQuestions(state, val) {
            if (val) {
                // make sure not to add duplicates
                if (!state.hiddenQuestions.some(x => x.id === val.id)) {
                    state.hiddenQuestions.unshift(val)
                }
            } else {
                state.hiddenQuestions = []
            }
        }
    }
})