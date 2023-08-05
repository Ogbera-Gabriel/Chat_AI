import express from "express";
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Create a simple async queue to process API requests sequentially
const requestQueue = [];
let isProcessing = false;

const processRequestQueue = async () => {
    if (requestQueue.length === 0 || isProcessing) return;
    isProcessing = true;

    const { req, res } = requestQueue.shift();

    try {
        const prompt = req.body.prompt;

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${prompt}`,
            temperature: 0,
            max_tokens: 3000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        res.status(200).send({
            bot: response.data.choices[0].text
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    } finally {
        isProcessing = false;
        processRequestQueue(); // Process the next request in the queue, if any
    }
};

app.post('/', async (req, res) => {
    try {
        requestQueue.push({ req, res });
        processRequestQueue();
    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }
});

app.listen(5000, () => console.log('Server is running on port http://localhost:5000'));
