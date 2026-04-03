import 'dotenv/config'
import express from "express"
import cors from "cors"

import { ChatGroq } from "@langchain/groq"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { retriever } from './utils/retriever.js'
import { combineDocuments } from './utils/combineDocument.js'
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables'

const app = express()
app.use(cors())
app.use(express.json())

const groqApiKey = process.env.GROQ_API_KEY

const llm = new ChatGroq({
  apiKey: groqApiKey,
  model: "llama-3.3-70b-versatile"
})

const standAloneTemplate =
  'Given a question, convert it into stand alone Question . question : {question} , stand alone question :'

const standAlonePrompt = PromptTemplate.fromTemplate(standAloneTemplate)

const answerTemplate = `You are a helpful support bot.
context:{context}
question:{question}
answer:`

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

const standAloneQuestionChain =
  standAlonePrompt.pipe(llm).pipe(new StringOutputParser())

const retrieverChain = RunnableSequence.from([
  prev => prev.standAlone_question,
  retriever,
  combineDocuments
])

const answerChain =
  answerPrompt.pipe(llm).pipe(new StringOutputParser())

const chain = RunnableSequence.from([
  {
    standAlone_question: standAloneQuestionChain,
    Original_input: new RunnablePassthrough()
  },
  {
    context: retrieverChain,
    question: ({ Original_input }) => Original_input.question
  },
  answerChain
])

// ✅ API route
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body
    const result = await chain.invoke({ question })
    res.json({ result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})