import { AgentCore } from './agent-core.js';
import { chat, getCurrentModel } from './api.js';
import ora from 'ora';
import chalk from 'chalk';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `
You are Kilo Agent, a highly capable autonomous software engineer.
You have FULL PERMISSION to read files, write files, and run bash commands on the user's machine.
Your goal is to complete the tasks requested by the user perfectly.

You work in a loop. In each iteration, you must evaluate the current state and decide on ONE action to take.
Your response MUST be in valid JSON format ONLY. Do not include markdown formatting like \`\`\`json.

Allowed actions:
1. { "action": "read_file", "path": "path/to/file" }
2. { "action": "write_file", "path": "path/to/file", "content": "file content here" }
3. { "action": "run_command", "command": "bash command to run" }
4. { "action": "list_files", "path": "dir/path" }
5. { "action": "done", "message": "Final message to user detailing what was accomplished" }
6. { "action": "think", "thought": "Long chain of thought, reasoning about the problem, burning tokens to ensure maximum correctness and zero bugs." }

To burn tokens and deep think (which you should do before writing any critical code or after an error), use the "think" action.
Always verify your work (e.g. by running tests or reading the file back) before calling "done".
`;

export async function runAgentLoop(task: string) {
    const core = new AgentCore();
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Task: ${task}` }
    ];

    console.log(chalk.cyan(`\n🚀 Bắt đầu quá trình tự động hóa (Model: ${getCurrentModel().name})...`));

    let isDone = false;
    let iterations = 0;
    const MAX_ITERATIONS = 30; // Ngăn chặn vòng lặp vô hạn

    while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        const spinner = ora(`Suy nghĩ (Vòng lặp ${iterations})...`).start();

        try {
            const responseText = await chat(messages);

            // Xử lý sanitize JSON đơn giản trong trường hợp model trả về markdown
            let jsonString = responseText.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonString.startsWith('```')) {
                 jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            let action;
            try {
                action = JSON.parse(jsonString);
            } catch (e) {
                 spinner.warn(chalk.yellow(`Lỗi parse JSON từ model. Yêu cầu trả lại đúng format.`));
                 messages.push({ role: 'assistant', content: responseText });
                 messages.push({ role: 'user', content: `Your response was not valid JSON. Error: ${(e as Error).message}. Please output ONLY valid JSON.`});
                 continue;
            }

            messages.push({ role: 'assistant', content: jsonString });
            spinner.stop();

            console.log(chalk.magenta(`[Action]: ${action.action}`));

            if (action.action === 'think') {
                console.log(chalk.gray(`🤔 Suy nghĩ sâu: ${action.thought}`));
                messages.push({ role: 'user', content: 'Action "think" acknowledged. Proceed.' });
            }
            else if (action.action === 'read_file') {
                console.log(chalk.blue(`📖 Đọc file: ${action.path}`));
                try {
                    const content = await core.readFile(action.path);
                    messages.push({ role: 'user', content: `File content:\n${content}` });
                } catch (e: any) {
                    messages.push({ role: 'user', content: `Error reading file: ${e.message}` });
                }
            }
            else if (action.action === 'write_file') {
                console.log(chalk.green(`✍️ Ghi file: ${action.path}`));
                try {
                    await core.writeFile(action.path, action.content);
                    messages.push({ role: 'user', content: `File written successfully.` });
                } catch (e: any) {
                    messages.push({ role: 'user', content: `Error writing file: ${e.message}` });
                }
            }
            else if (action.action === 'run_command') {
                console.log(chalk.yellow(`💻 Chạy lệnh: ${action.command}`));
                const result = await core.runCommand(action.command);
                console.log(chalk.dim(`  stdout: ${result.stdout.slice(0, 200)}...`));
                if(result.stderr) console.log(chalk.red(`  stderr: ${result.stderr.slice(0, 200)}...`));

                messages.push({ role: 'user', content: `Command output:\nstdout: ${result.stdout}\nstderr: ${result.stderr}` });
            }
            else if (action.action === 'list_files') {
                console.log(chalk.blue(`📂 List thư mục: ${action.path}`));
                try {
                    const files = await core.listFiles(action.path);
                    messages.push({ role: 'user', content: `Files: ${files.join(', ')}` });
                } catch (e: any) {
                    messages.push({ role: 'user', content: `Error listing files: ${e.message}` });
                }
            }
            else if (action.action === 'done') {
                isDone = true;
                console.log(chalk.green.bold(`\n🎉 Hoàn thành: ${action.message}\n`));
            } else {
                 messages.push({ role: 'user', content: `Unknown action: ${action.action}` });
            }

        } catch (error: any) {
            spinner.fail(chalk.red(`Lỗi khi gọi API: ${error.message}`));
            break;
        }
    }

    if (!isDone) {
        console.log(chalk.red.bold(`\n⚠️ Đã đạt giới hạn số vòng lặp (${MAX_ITERATIONS}), dừng Agent.`));
    }
}
