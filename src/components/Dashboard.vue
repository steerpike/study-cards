<template>
    <div id="dashboard">
        <section>
            <div class="col1">
                <div class="profile">
                    <h5>{{ userProfile.name }}</h5>
                    <p>{{ userProfile.title }}</p>
                    <div class="create-question">
                        <p>Create a Question</p>
                        <form @submit.prevent>
                            <textarea v-model.trim="question.content"></textarea>
                            <button @click="createQuestion" :disabled="question.content ==''" class="button">Add Question</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col2">
              <transition name="fade">
                  <div v-if="hiddenQuestions.length" @click="showNewQuestions" class="hidden-questions">
                      <p>
                          Click to show <span class="new-questions">{{ hiddenQuestions.length }}</span> 
                          new <span v-if="hiddenQuestions.length > 1">questions</span><span v-else>question</span>
                      </p>
                  </div>
              </transition>
                <div v-if="questions.length">
                    <div v-for="question in questions" class="question">
                        <h5>{{ question.userName }}</h5>
                        <span>{{ question.createdOn | formatDate }}</span>
                        <p>{{ question.content }}</p>
                        <ul>
                            <li @click="openAnswerModal(question)"><a>Answers {{ question.answers }}</a></li>
                            <li><a @click="answerQuestion(question.id, question.responses)">Responses {{ question.responses }}</a></li>
                            <li><a @click="viewQuestion(question)">view full question</a></li>
                        </ul>
                    </div>
                </div>
                <div v-else>
                    <p class="no-results">There are currently no questions</p>
                </div>
            </div>
        </section>

        <transition name="fade">
          <div v-if="showAnswerModal" class="c-modal">
              <div class="c-container">
                  <a @click="closeAnswerModal">X</a>
                  <p>add an answer</p>
                  <form @submit.prevent>
                      <textarea v-model.trim="answer.content"></textarea>
                      <button @click="addAnswer" :disabled="answer.content == ''" class="button">add answer</button>
                  </form>
              </div>
          </div>
      </transition>
    <!-- question modal -->
    <transition name="fade">
        <div v-if="showQuestionModal" class="p-modal">
            <div class="p-container">
                <a @click="closeQuestionModal" class="close">X</a>
                <div class="question">
                    <h5>{{ fullQuestion.userName }}</h5>
                    <span>{{ fullQuestion.createdOn | formatDate }}</span>
                    <p>{{ fullQuestion.content }}</p>
                    <ul>
                        <li><a>answers {{ fullQuestion.answers }}</a></li>
                        <li><a>responses {{ fullQuestion.responses }}</a></li>
                    </ul>
                </div>
                <div v-show="questionAnswers.length" class="answers">
                    <div v-for="answer in questionAnswers" class="answers">
                        <p>{{ answer.userName }}</p>
                        <span>{{ answer.createdOn | formatDate }}</span>
                        <p>{{ answer.content }}</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
    </div>
</template>

<script>
    import { mapState } from 'vuex'
    import moment from 'moment'
    const fb = require('../firebaseConfig.js')
    export default {
        data() {
            return {
                question: {
                  content: ''
                },
                answer: {
                  questionId: '',
                  userId: '',
                  content: '',
                  questionAnswers: 0
                },
                showAnswerModal: false,
                showQuestionModal: false,
                fullQuestion: {},
                questionAnswers: []
            }
        },
        computed: {
            ...mapState(['userProfile', 'currentUser', 'questions', 'hiddenQuestions'])
        },
        methods: {
            createQuestion() {
              fb.questionsCollection.add({
                  createdOn: new Date(),
                  content: this.question.content,
                  userId: this.currentUser.uid,
                  userName: this.userProfile.name,
                  answers: 0,
                  responses: 0
              }).then(ref => {
                  this.question.content = ''
              }).catch(err => {
                  console.log(err)
              })
            },
            showNewQuestions() {
                let updatedQuestionsArray = this.hiddenQuestions.concat(this.questions)
                // clear hiddenQuestions array and update questions array
                this.$store.commit('setHiddenQuestions', null)
                this.$store.commit('setQuestions', updatedQuestionsArray)
            },
            openAnswerModal(question) {
                this.answer.questionId = question.id
                this.answer.userId = question.userId
                this.answer.questionAnswers = question.answers
                this.showAnswerModal = true
            },  
            closeAnswerModal() {
                this.answer.questionId = ''
                this.answer.userId = ''
                this.answer.content = ''
                this.showAnswerModal = false
            },  
            addAnswer() {
                let questionId = this.answer.questionId
                let questionAnswers = this.answer.questionAnswers
                fb.answersCollection.add({
                    createdOn: new Date(),
                    content: this.answer.content,
                    questionId: questionId,
                    userId: this.currentUser.uid,
                    userName: this.userProfile.name
                }).then(doc => {
                    fb.questionsCollection.doc(questionId).update({
                        answers: questionAnswers + 1
                    }).then(() => {
                        this.closeAnswerModal()
                    })
                }).catch(err => {
                    console.log(err)
                })
            },
            answerQuestion(questionId, questionResponses) {
                let docId = `${this.currentUser.uid}_${questionId}`

                fb.responsesCollection.doc(docId).get().then(doc => {
                    if (doc.exists) {
                        return
                    }

                    fb.responsesCollection.doc(docId).set({
                        questionId: questionId,
                        userId: this.currentUser.uid
                    }).then(() => {
                        // update post likes
                        fb.questionsCollection.doc(questionId).update({
                            responses: questionResponses + 1
                        })
                    })
                }).catch(err => {
                    console.log(err)
                })
            },
            viewQuestion(question) {
                fb.answersCollection.where('questionId', '==', question.id).get().then(docs => {
                    let answersArray = []

                    docs.forEach(doc => {
                        let answer = doc.data()
                        answer.id = doc.id
                        answersArray.push(answer)
                    })

                    this.questionAnswers = answersArray
                    this.fullQuestion = question
                    this.showQuestionModal = true
                }).catch(err => {
                    console.log(err)
                })
            },
            closeQuestionModal() {
                this.questionAnswers = []
                this.showQuestionModal = false
            }
        },
        filters: {
            formatDate(val) {
                if (!val) { return '-' }
                let date = val.toDate()
                return moment(date).fromNow()
            },
            trimLength(val) {
                if (val.length < 200) { return val }
                return `${val.substring(0, 200)}...`
            }
        }
    }
</script>

<style>

</style>