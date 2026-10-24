import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class AgentCore {
    private cwd: string;

    constructor(cwd: string = process.cwd()) {
        this.cwd = cwd;
    }

    async readFile(filePath: string): Promise<string> {
        const fullPath = path.resolve(this.cwd, filePath);
        try {
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const fullPath = path.resolve(this.cwd, filePath);
        const dir = path.dirname(fullPath);

        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    async runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const { stdout, stderr } = await execAsync(command, { cwd: this.cwd });
            return { stdout, stderr };
        } catch (error: any) {
             return { stdout: error.stdout || '', stderr: error.stderr || error.message };
        }
    }

    async listFiles(dirPath: string = '.'): Promise<string[]> {
        const fullPath = path.resolve(this.cwd, dirPath);
        try {
            const files = await fs.readdir(fullPath);
            return files;
        } catch (error: any) {
            throw new Error(`Failed to list files in ${dirPath}: ${error.message}`);
        }
    }
}
