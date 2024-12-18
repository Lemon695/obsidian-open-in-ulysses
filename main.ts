import {App, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {exec} from 'child_process';

interface UlyssesPluginSettings {
	ulyssesPath: string;
}

const DEFAULT_SETTINGS: UlyssesPluginSettings = {
	ulyssesPath: '/Applications/UlyssesMac.app'
}

export default class UlyssesPlugin extends Plugin {
	settings: UlyssesPluginSettings;

	async onload() {
		await this.loadSettings();

		// 添加命令到Obsidian命令面板
		this.addCommand({
			id: 'open-in-ulysses',
			name: 'Open current file in Ulysses',
			callback: () => this.openInUlysses()
		});

		// 添加设置选项卡
		this.addSettingTab(new UlyssesSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	openInUlysses() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('没有打开任何文件');
			return;
		}

		const filePath = activeFile.path;
		const resourcePath = this.app.vault.adapter.getResourcePath(filePath);

		// 尝试从 resourcePath 中提取实际文件路径
		const match = resourcePath.match(/app:\/\/[^/]+(.+)\?/);
		const fullPath = match ? decodeURIComponent(match[1]) : null;

		if (!fullPath) {
			new Notice('无法获取文件路径');
			return;
		}

		console.log(`fullPath=${fullPath}`);

		// 使用MacOS的open命令打开文件
		exec(`open -a "${this.settings.ulyssesPath}" "${fullPath}"`, (error) => {
			if (error) {
				new Notice(`打开文件失败: ${error.message}`);
			} else {
				new Notice('已在Ulysses中打开文件');
			}
		});
	}
}

class UlyssesSettingTab extends PluginSettingTab {
	plugin: UlyssesPlugin;

	constructor(app: App, plugin: UlyssesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Ulysses 应用路径')
			.setDesc('设置Ulysses应用的完整路径')
			.addText(text => text
				.setPlaceholder('/Applications/UlyssesMac.app')
				.setValue(this.plugin.settings.ulyssesPath)
				.onChange(async (value) => {
					this.plugin.settings.ulyssesPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
