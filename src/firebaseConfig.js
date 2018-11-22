//import firebase from 'firebase'
import firebase from 'firebase/app'
import 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
//import 'firebase/firestore'

// firebase init goes here
var config = {
    apiKey: "AIzaSyBWkhO09bCzhBvIDX1yiWOb9rurwA1QUvI",
    authDomain: "study-cards-9b402.firebaseapp.com",
    databaseURL: "https://study-cards-9b402.firebaseio.com",
    projectId: "study-cards-9b402",
    storageBucket: "study-cards-9b402.appspot.com",
    messagingSenderId: "851652330835"
  };
firebase.initializeApp(config)

// firebase utils
const db = firebase.firestore()
const auth = firebase.auth()
const currentUser = auth.currentUser

// date issue fix according to firebase
const settings = {
    timestampsInSnapshots: true
}
db.settings(settings)

// firebase collections
const usersCollection = db.collection('users')
const questionsCollection = db.collection('questions')
const answersCollection = db.collection('answers')
const responsesCollection = db.collection('responses')

export {
    db,
    auth,
    currentUser,
    usersCollection,
    questionsCollection,
    answersCollection,
    responsesCollection
}