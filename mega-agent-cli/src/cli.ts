import { intro, outro, select, text, isCancel } from '@clack/prompts';
import { defaultModels, setModel, getCurrentModel } from './api.js';
import chalk from 'chalk';
import gradient from 'gradient-string';

export async function manageModels() {
    intro(gradient.pastel('🤖 Quản lý Models & API'));

    const modelOptions = Object.entries(defaultModels).map(([id, config]) => ({
        value: id,
        label: `${config.name} (Hiện tại: ${config.model})`,
    }));

    const selectedModel = await select({
        message: 'Chọn model bạn muốn sử dụng:',
        options: modelOptions,
    });

    if (isCancel(selectedModel)) {
        outro('Đã hủy thao tác.');
        return;
    }

    const currentConfig = defaultModels[selectedModel as string];
    if(!currentConfig) return;

    let apiKey = currentConfig.apiKey;

    if (!apiKey) {
        const inputKey = await text({
            message: `Nhập API Key cho ${currentConfig.name} (Bỏ qua nếu đã có trong .env hoặc không cần):`,
            placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
        });

        if (isCancel(inputKey)) {
            outro('Đã hủy thao tác.');
            return;
        }

        apiKey = (inputKey as string).trim();
    }

    setModel(selectedModel as string, { apiKey: apiKey || undefined });

    outro(chalk.green(`✅ Đã chuyển sang model: ${chalk.bold(getCurrentModel().name)}`));
}
