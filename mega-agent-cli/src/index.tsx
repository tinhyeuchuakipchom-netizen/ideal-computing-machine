import React, { useState } from 'react';
import { render, Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { manageModels } from './cli.js';
import { runAgentLoop } from './agent-loop.js';
import * as clack from '@clack/prompts';

const App = () => {
    const [view, setView] = useState('menu');

    const handleSelect = async (item: any) => {
        if (item.value === 'exit') {
            process.exit();
        } else if (item.value === 'models') {
            setView('hide');
            await manageModels();
            setView('menu');
        } else if (item.value === 'start') {
            setView('hide');
            const task = await clack.text({
                message: 'Mô tả yêu cầu/task để Agent bắt đầu tự động hóa (Deep Coding):',
                placeholder: 'Tạo một script python tính fibonacci...',
            });
            if (!clack.isCancel(task) && task) {
                 await runAgentLoop(task as string);
            }
            setView('menu');
        } else if (item.value === 'chat') {
            setView('hide');
            console.log(chalk.yellow('\nChức năng Chat trực tiếp đang được phát triển...'));
            setTimeout(() => setView('menu'), 2000);
        }
    };

    const items = [
        { label: '🚀 Khởi động Mega Agent (Full Permission & Deep Coding)', value: 'start' },
        { label: '🤖 Quản lý Models & API (Qwen, Gemini, Kilo)', value: 'models' },
        { label: '💬 Chat trực tiếp (Sắp có)', value: 'chat' },
        { label: '❌ Thoát', value: 'exit' },
    ];

    if (view === 'hide') {
        return null;
    }

    return (
        <Box flexDirection="column" padding={1} borderStyle="round" borderColor="magenta">
            <Box marginBottom={1}>
                <Text bold>{gradient.pastel('===== KILO AGENT CLI SIÊU ĐẸP X3 X4 =====')}</Text>
            </Box>
            <Text color="cyan">Chọn một tùy chọn bên dưới:</Text>
            <Box marginTop={1}>
                <SelectInput items={items} onSelect={handleSelect} />
            </Box>
        </Box>
    );
};

console.clear();
render(<App />);
