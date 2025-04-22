Chat Completion Models
The Groq Chat Completions API processes a series of messages and generates output responses. These models can perform multi-turn discussions or tasks that require only one interaction.


For details about the parameters, visit the reference page.

JSON mode
JSON mode is a feature that guarantees all chat completions are valid JSON.

Usage:

Set "response_format": {"type": "json_object"} in your chat completion request
Add a description of the desired JSON structure within the system prompt (see below for example system prompts)
Recommendations for best JSON results:

Llama performs best at generating JSON, followed by Gemma, then Mixtral
Use pretty-printed JSON instead of compact JSON
Keep prompts concise
JSON mode Limitations:

Does not support streaming
Does not support stop sequences
Error Code:

Groq will return a 400 error with an error code of json_validate_failed if JSON generation fails.
Example system prompts:



You are a legal advisor who summarizes documents in JSON


You are a data analyst API capable of sentiment analysis that responds in JSON.  The JSON schema should include
{
  "sentiment_analysis": {
    "sentiment": "string (positive, negative, neutral)",
    "confidence_score": "number (0-1)"
    # Include additional fields as required
  }
}
Generating Chat Completions with Groq SDK
Code Overview
Python
JavaScript

npm install --save groq-sdk

Performing a basic Chat Completion

import Groq from "groq-sdk";

const groq = new Groq();

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export const getGroqChatCompletion = async () => {
  return groq.chat.completions.create({
    //
    // Required parameters
    //
    messages: [
      // Set an optional system message. This sets the behavior of the
      // assistant and can be used to provide specific instructions for
      // how it should behave throughout the conversation.
      {
        role: "system",
        content: "you are a helpful assistant.",
      },
      // Set a user message for the assistant to respond to.
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],

    // The language model which will generate the completion.
    model: "llama-3.3-70b-versatile",

    //
    // Optional parameters
    //

    // Controls randomness: lowering results in less random completions.
    // As the temperature approaches zero, the model will become deterministic
    // and repetitive.
    temperature: 0.5,

    // The maximum number of tokens to generate. Requests can use up to
    // 2048 tokens shared between prompt and completion.
    max_completion_tokens: 1024,

    // Controls diversity via nucleus sampling: 0.5 means half of all
    // likelihood-weighted options are considered.
    top_p: 1,

    // A stop sequence is a predefined or user-specified text string that
    // signals an AI to stop generating content, ensuring its responses
    // remain focused and concise. Examples include punctuation marks and
    // markers like "[end]".
    stop: null,

    // If set, partial message deltas will be sent.
    stream: false,
  });
};

main();

Streaming a Chat Completion
To stream a completion, simply set the parameter stream=True. Then the completion function will return an iterator of completion deltas rather than a single, full completion.



import Groq from "groq-sdk";

const groq = new Groq();

export async function main() {
  const stream = await getGroqChatStream();
  for await (const chunk of stream) {
    // Print the completion returned by the LLM.
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

export async function getGroqChatStream() {
  return groq.chat.completions.create({
    //
    // Required parameters
    //
    messages: [
      // Set an optional system message. This sets the behavior of the
      // assistant and can be used to provide specific instructions for
      // how it should behave throughout the conversation.
      {
        role: "system",
        content: "you are a helpful assistant.",
      },
      // Set a user message for the assistant to respond to.
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],

    // The language model which will generate the completion.
    model: "llama-3.3-70b-versatile",

    //
    // Optional parameters
    //

    // Controls randomness: lowering results in less random completions.
    // As the temperature approaches zero, the model will become deterministic
    // and repetitive.
    temperature: 0.5,

    // The maximum number of tokens to generate. Requests can use up to
    // 2048 tokens shared between prompt and completion.
    max_completion_tokens: 1024,

    // Controls diversity via nucleus sampling: 0.5 means half of all
    // likelihood-weighted options are considered.
    top_p: 1,

    // A stop sequence is a predefined or user-specified text string that
    // signals an AI to stop generating content, ensuring its responses
    // remain focused and concise. Examples include punctuation marks and
    // markers like "[end]".
    stop: null,

    // If set, partial message deltas will be sent.
    stream: true,
  });
}

main();
Streaming a chat completion with a stop sequence

import Groq from "groq-sdk";

const groq = new Groq();

export async function main() {
  const stream = await getGroqChatStream();
  for await (const chunk of stream) {
    // Print the completion returned by the LLM.
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

export async function getGroqChatStream() {
  return groq.chat.completions.create({
    //
    // Required parameters
    //
    messages: [
      // Set an optional system message. This sets the behavior of the
      // assistant and can be used to provide specific instructions for
      // how it should behave throughout the conversation.
      {
        role: "system",
        content: "you are a helpful assistant.",
      },
      // Set a user message for the assistant to respond to.
      {
        role: "user",
        content:
          "Start at 1 and count to 10.  Separate each number with a comma and a space",
      },
    ],

    // The language model which will generate the completion.
    model: "llama-3.3-70b-versatile",

    //
    // Optional parameters
    //

    // Controls randomness: lowering results in less random completions.
    // As the temperature approaches zero, the model will become deterministic
    // and repetitive.
    temperature: 0.5,

    // The maximum number of tokens to generate. Requests can use up to
    // 2048 tokens shared between prompt and completion.
    max_completion_tokens: 1024,

    // Controls diversity via nucleus sampling: 0.5 means half of all
    // likelihood-weighted options are considered.
    top_p: 1,

    // A stop sequence is a predefined or user-specified text string that
    // signals an AI to stop generating content, ensuring its responses
    // remain focused and concise. Examples include punctuation marks and
    // markers like "[end]".
    //
    // For this example, we will use ", 6" so that the llm stops counting at 5.
    // If multiple stop values are needed, an array of string may be passed,
    // stop: [", 6", ", six", ", Six"]
    stop: ", 6",

    // If set, partial message deltas will be sent.
    stream: true,
  });
}

main();
JSON Mode

import Groq from "groq-sdk";
const groq = new Groq();

// Define the JSON schema for recipe objects
// This is the schema that the model will use to generate the JSON object, 
// which will be parsed into the Recipe class.
const schema = {
  $defs: {
    Ingredient: {
      properties: {
        name: { title: "Name", type: "string" },
        quantity: { title: "Quantity", type: "string" },
        quantity_unit: {
          anyOf: [{ type: "string" }, { type: "null" }],
          title: "Quantity Unit",
        },
      },
      required: ["name", "quantity", "quantity_unit"],
      title: "Ingredient",
      type: "object",
    },
  },
  properties: {
    recipe_name: { title: "Recipe Name", type: "string" },
    ingredients: {
      items: { $ref: "#/$defs/Ingredient" },
      title: "Ingredients",
      type: "array",






Reasoning
Reasoning models excel at complex problem-solving tasks that require step-by-step analysis, logical deduction, and structured thinking and solution validation. With Groq inference speed, these types of models can deliver instant reasoning capabilities critical for real-time applications.

Why Speed Matters for Reasoning
Reasoning models are capable of complex decision making with explicit reasoning chains that are part of the token output and used for decision-making, which make low-latency and fast inference essential. Complex problems often require multiple chains of reasoning tokens where each step build on previous results. Low latency compounds benefits across reasoning chains and shaves off minutes of reasoning to a response in seconds.

Supported Model
Model ID	Model
qwen-qwq-32b

Qwen QwQ 32B
deepseek-r1-distill-llama-70b

DeepSeek R1 Distil Llama 70B
Reasoning Format
Groq API supports explicit reasoning formats through the reasoning_format parameter, giving you fine-grained control over how the model's reasoning process is presented. This is particularly valuable for valid JSON outputs, debugging, and understanding the model's decision-making process.

Note: The format defaults to raw or parsed when JSON mode or tool use are enabled as those modes do not support raw. If reasoning is explicitly set to raw with JSON mode or tool use enabled, we will return a 400 error.

Options for Reasoning Format
reasoning_format Options	Description
parsed	Separates reasoning into a dedicated field while keeping the response concise.
raw	Includes reasoning within think tags in the content.
hidden	Returns only the final answer.
Quick Start
Python
JavaScript
curl

import Groq from 'groq-sdk';

const client = new Groq();
const completion = await client.chat.completions.create({
    model: "deepseek-r1-distill-llama-70b",
    messages: [
        {
            role: "user",
            content: "How many r's are in the word strawberry?"
        }
    ],
    temperature: 0.6,
    max_completion_tokens: 1024,
    top_p: 0.95,
    stream: true,
    reasoning_format: "raw"
});

for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0].delta.content || "");
}
Quick Start with Tool use

curl https://api.groq.com//openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -d '{
    "model": "deepseek-r1-distill-llama-70b",
    "messages": [
        {
            "role": "user",
            "content": "What is the weather like in Paris today?"
        }
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current temperature for a given location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and country e.g. Bogotá, Colombia"
                        }
                    },
                    "required": [
                        "location"
                    ],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    ]}'
Recommended Configuration Parameters
Parameter	Default	Range	Description
messages	-	-	Array of message objects. Important: Avoid system prompts - include all instructions in the user message!
temperature	0.6	0.0 - 2.0	Controls randomness in responses. Lower values make responses more deterministic. Recommended range: 0.5-0.7 to prevent repetitions or incoherent outputs
max_completion_tokens	1024	-	Maximum length of model's response. Default may be too low for complex reasoning - consider increasing for detailed step-by-step solutions
top_p	0.95	0.0 - 1.0	Controls diversity of token selection
stream	false	boolean	Enables response streaming. Recommended for interactive reasoning tasks
stop	null	string/array	Custom stop sequences
seed	null	integer	Set for reproducible results. Important for benchmarking - run multiple tests with different seeds
json_mode	-	boolean	Set to enable JSON mode for structured output.
reasoning_format	raw	"parsed", "raw", "hidden"	Controls how model reasoning is presented in the response. Must be set to either parsed or hidden when using tool calling or JSON mode.
Optimizing Performance
Temperature and Token Management
The model performs best with temperature settings between 0.5-0.7, with lower values (closer to 0.5) producing more consistent mathematical proofs and higher values allowing for more creative problem-solving approaches. Monitor and adjust your token usage based on the complexity of your reasoning tasks - while the default max_completion_tokens is 1024, complex proofs may require higher limits.

Prompt Engineering
To ensure accurate, step-by-step reasoning while maintaining high performance:

DeepSeek-R1 works best when all instructions are included directly in user messages rather than system prompts.
Structure your prompts to request explicit validation steps and intermediate calculations.
Avoid few-shot prompting and go for zero-shot prompting only.




Groq Batch API
Process large-scale workloads asynchronously with our Batch API.

What is Batch Processing?
Batch processing lets you run thousands of API requests at scale by submitting your workload as an asynchronous batch of requests to Groq with 25% lower cost (50% off from now until end of April 2025), no impact to your standard rate limits, and 24-hour processing window.

Overview
While some of your use cases may require synchronous API requests, asynchronous batch processing is perfect for use cases that don't need immediate reponses or for processing a large number of queries that standard rate limits cannot handle, such as processing large datasets, generating content in bulk, and running evaluations.

Compared to using our synchronous API endpoints, our Batch API has:

Higher rate limits: Process thousands of requests per batch with no impact on your standard API rate limits
Cost efficiency: 25% cost discount compared to synchronous APIs (50% off now until end of April 2025)
Model Availability and Pricing
The Batch API can currently be used to execute queries for chat completion (both text and vision) and audio transcription inputs with the following models:

Chat Completions
Audio Transcriptions
mistral-saba-24b

llama-3.3-70b-versatile

deepseek-r1-distill-llama-70b

llama-3.1-8b-instant

llama-4-scout-17b-16e-instruct

llama-4-maverick-17b-128e-instruct

Pricing is at a 25% cost discount compared to synchronous API pricing (50% off now until end of April 2025). 

Getting Started
Our Batch API endpoints allow you to collect a group of requests into a single file, kick off a batch processing job to execute the requests within your file, query for the status of your batch, and eventually retrieve the results when your batch is complete.

Multiple batch jobs can be submitted at once.

Each batch has a 24-hour processing window, during which we'll process as many requests as our capacity allows while maintaining service quality for all users. We allow for setting a batch window from 24 hours to 7 days and recommend setting a longer batch window allow us more time to complete your batch jobs instead of expiring them.

1. Prepare Your Batch File
A batch is composed of a list of API requests and every batch job starts with a JSON Lines (JSONL) file that contains the requests you want processed. Each line in this file represents a single API call.

The Groq Batch API currently supports:

Chat completion requests through /v1/chat/completions
Audio transcription requests through /v1/audio/transcriptions
The structure for each line must include:

custom_id: Your unique identifier for tracking the batch request
method: The HTTP method (currently POST only)
url: The API endpoint to call (/v1/chat/completions or /v1/audio/transcriptions)
body: The parameters of your request matching our synchronous API format. See our API Reference here. 
The following is an example of a JSONL batch file with different types of requests:

Chat Completions
Audio Transcriptions
Mixed Batch

{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "llama-3.1-8b-instant", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is 2+2?"}]}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "llama-3.1-8b-instant", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is 2+3?"}]}}
{"custom_id": "request-3", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "llama-3.1-8b-instant", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "count up to 1000000. starting with 1, 2, 3. print all the numbers, do not stop until you get to 1000000."}]}}
Converting Sync Calls to Batch Format
If you're familiar with making synchronous API calls, converting them to batch format is straightforward. Here's how a regular API call transforms into a batch request:

Chat Completions
Audio Transcriptions

# Your typical synchronous API call:
response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "user", "content": "What is quantum computing?"}
    ]
)

# The same call in batch format (must be on a single line as JSONL):
{"custom_id": "quantum-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "What is quantum computing?"}]}}
2. Upload Your Batch File
Upload your .jsonl batch file using the Files API endpoint for when kicking off your batch job:

Note: The Files API currently only supports .jsonl files 50,000 lines or less and up to maximum of 200MB in size. There is no limit for the number of batch jobs you can submit. We recommend submitting multiple shorter batch files for a better chance of completion.

Python
JavaScript
curl

import fs from 'fs';
import { config } from 'dotenv';  // npm install dotenv (Not neeeded for Node 20+)
config();

/* Only needed for Node 18 and below 
import FormData from 'form-data'; // npm install form-data first!
import fetch from 'node-fetch'; // npm install node-fetch first!
*/

async function uploadFileToGroq(apiKey, filePath) {
    const url = 'https://api.groq.com/openai/v1/files';
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], filePath.split('/').pop(), { type: 'application/jsonl' });
 
    const formData = new FormData();
    formData.append('purpose', 'batch');
    formData.append('file', file);
 
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData
        });
 
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText} ${await response.text()}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
 }
 
 const apiKey = process.env.GROQ_API_KEY;
 if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
 }
 
 const filePath = 'batch_file.jsonl'; // Path to your JSONL file
 
 uploadFileToGroq(apiKey, filePath)
    .then(result => console.log('Upload result:', result))
    .catch(error => console.error('Error:', error));
You will receive a JSON response that contains the ID (id) for your file object that you will then use to create your batch job:


{
    "id":"file_01jh6x76wtemjr74t1fh0faj5t",
    "object":"file",
    "bytes":966,
    "created_at":1736472501,
    "filename":"input_file.jsonl",
    "purpose":"batch"
}
3. Create Your Batch Job
Once you've uploaded your .jsonl file, you can use the file object ID (in this case, file_01jh6x76wtemjr74t1fh0faj5t as shown in Step 2) to create a batch:

Note: The completion window for batch jobs can be set from to 24 hours (24h) to 7 days (7d). We recommend setting a longer batch window to have a better chance for completed batch jobs rather than expirations for when we are under heavy load.

Python
JavaScript
curl

import { config } from 'dotenv'; // npm install dotenv (Not neeeded for Node 20+)
config();

async function createBatch(apiKey, inputFileId) {
    const url = 'https://api.groq.com/openai/v1/batches';
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    const data = {
        input_file_id: inputFileId,
        endpoint: '/v1/chat/completions',
        completion_window: '24h'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText} ${await response.text()}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw new Error(`Batch creation failed: ${error.message}`);
    }
}

// Usage example
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
}

const fileId = 'file_01jh6x76wtemjr74t1fh0faj5t'; // replace with your `id` from file upload API response object

createBatch(apiKey, fileId)
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
This request will return a Batch object with metadata about your batch, including the batch id that you can use to check the status of your batch:


{
    "id":"batch_01jh6xa7reempvjyh6n3yst2zw",
    "object":"batch",
    "endpoint":"/v1/chat/completions",
    "errors":null,
    "input_file_id":"file_01jh6x76wtemjr74t1fh0faj5t",
    "completion_window":"24h",
    "status":"validating",
    "output_file_id":null,
    "error_file_id":null,
    "finalizing_at":null,
    "failed_at":null,
    "expired_at":null,
    "cancelled_at":null,
    "request_counts":{
        "total":0,
        "completed":0,
        "failed":0
    },
    "metadata":null,
    "created_at":1736472600,
    "expires_at":1736559000,
    "cancelling_at":null,
    "completed_at":null,
    "in_progress_at":null
}
4. Check Batch Status
You can check the status of a batch any time your heart desires with the batch id (in this case, batch_01jh6xa7reempvjyh6n3yst2zw from the above Batch response object), which will also return a Batch object:

Python
JavaScript
curl

import { config } from 'dotenv';  // npm install dotenv (Not neeeded for Node 20+)
config();

async function getBatchStatus(apiKey, batchId) {
    const url = `https://api.groq.com/openai/v1/batches/${batchId}`;
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText} ${await response.text()}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw new Error(`Failed to get batch status: ${error.message}`);
    }
}

// Usage example
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
}

const batchId = 'batch_01jh6xa7reempvjyh6n3yst2zw';

getBatchStatus(apiKey, batchId)
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
The status of a given batch job can return any of the following status codes:

Status	Description
validating	batch file is being validated before the batch processing begins
failed	batch file has failed the validation process
in_progress	batch file was successfully validated and the batch is currently being run
finalizing	batch has completed and the results are being prepared
completed	batch has been completed and the results are ready
expired	batch was not able to be completed within the 24-hour time window
cancelling	batch is being cancelled (may take up to 10 minutes)
cancelled	batch was cancelled
When your batch job is complete, the Batch object will return an output_file_id and/or an error_file_id that you can then use to retrieve your results (as shown below in Step 5). Here's an example:


{
    "id":"batch_01jh6xa7reempvjyh6n3yst2zw",
    "object":"batch",
    "endpoint":"/v1/chat/completions",
    "errors":[
        {
            "code":"invalid_method",
            "message":"Invalid value: 'GET'. Supported values are: 'POST'","param":"method",
            "line":4
        }
    ],
    "input_file_id":"file_01jh6x76wtemjr74t1fh0faj5t",
    "completion_window":"24h",
    "status":"completed",
    "output_file_id":"file_01jh6xa97be52b7pg88czwrrwb",
    "error_file_id":"file_01jh6xa9cte52a5xjnmnt5y0je",
    "finalizing_at":null,
    "failed_at":null,
    "expired_at":null,
    "cancelled_at":null,
    "request_counts":
    {
        "total":3,
        "completed":2,
        "failed":1
    },
    "metadata":null,
    "created_at":1736472600,
    "expires_at":1736559000,
    "cancelling_at":null,
    "completed_at":1736472607,
    "in_progress_at":1736472601
}
5. Retrieve Batch Results
Now for the fun. Once the batch is complete, you can retrieve the results using the output_file_id from your Batch object (in this case, file_01jh6xa97be52b7pg88czwrrwb from the above Batch response object) and write it to a file on your machine (batch_output.jsonl in this case) to view them:

Python
JavaScript
curl

import fs from 'fs';
import { config } from 'dotenv';  // npm install dotenv (Not neeeded for Node 20+)
config();

async function downloadFileContent(apiKey, outputFileId, outputFile) {
    const url = `https://api.groq.com/openai/v1/files/${outputFileId}/content`;
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText} ${await response.text()}`);
        }

        // Get the response as a buffer/text
        const content = await response.text();
        
        // Write to file
        fs.writeFileSync(outputFile, content);
        
        return `File downloaded successfully to ${outputFile}`;
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

// Usage example
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
}

const outputFileId = 'file_01jh6xa97be52b7pg88czwrrwb'; // replace with your own completed batch job's `output_file_id`
const outputFile = 'batch_output.jsonl'; // replace with your own file of choice to download batch job contents to

downloadFileContent(apiKey, outputFileId, outputFile)
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
The output .jsonl file will have one response line per successful request line of your batch file. Each line includes the original custom_id for mapping results, a unique batch request ID, and the response:


{"id": "batch_req_123", "custom_id": "my-request-1", "response": {"status_code": 200, "request_id": "req_abc", "body": {"id": "completion_xyz", "model": "llama-3.1-8b-instant", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Hello!"}}], "usage": {"prompt_tokens": 20, "completion_tokens": 5, "total_tokens": 25}}}, "error": null}
Any failed or expired requests in the batch will have their error information written to an error file that can be accessed via the batch's error_file_id.

Note: Results may not appears in the same order as your batch request submissions. Always use the custom_id field to match results with your original request.

List Batches
You can view all your batch jobs by making a call to https://api.groq.com/openai/v1/batches:


curl https://api.groq.com/openai/v1/batches \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
Batch Size
The Files API supports JSONL files up to 50,000 lines and 200MB in size. Multiple batch jobs can be submitted at once.

Note: Consider splitting very large workloads into multiple smaller batches (e.g. 1000 requests per batch) for a better chance at completion rather than expiration for when we are under heavy load.

Batch Expiration
Each batch has a 24-hour processing window during which we'll process as many requests as our capacity allows while maintaining service quality for all users.

We recommend setting a longer batch window for a better chance of completing your batch job rather than returning expired jobs when we are under heavy load.

Batch jobs that do not complete within the 24-hour processing window will have a status of expired.

In cases where your batch job expires:

You are only charged for successfully completed requests
You can access all completed results and see which request IDs were not processed
You can resubmit any uncompleted requests in a new batch
Data Expiration
Input, intermediate files, and results from processed batches will be stored securely for up to 30 days in Groq's systems. You may also immediately delete once a processed batch is retrieved.

Rate limits
The Batch API rate limits are separate than existing per-model rate limits for synchronous requests. Using the Batch API will not consume tokens from your standard per-model limits, which means you can conveniently leverage batch processing to increase the number of tokens you process with us.

See your limits here. 
