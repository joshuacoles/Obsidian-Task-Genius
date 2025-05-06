// Japanese translations
const translations = {
	"Comprehensive task management plugin for Obsidian with progress bars, task status cycling, and advanced task tracking features.":
		"プログレスバー、タスクステータスサイクル、高度なタスク追跡機能を備えたObsidian用の包括的なタスク管理プラグイン。",
	"Show progress bar": "プログレスバーを表示",
	"Toggle this to show the progress bar.":
		"プログレスバーを表示するにはこれを切り替えてください。",
	"Support hover to show progress info": "ホバーでプログレス情報を表示",
	"Toggle this to allow this plugin to show progress info when hovering over the progress bar.":
		"プログレスバーにカーソルを合わせたときに進捗情報を表示できるようにするにはこれを切り替えてください。",
	"Add progress bar to non-task bullet":
		"非タスク箇条書きにプログレスバーを追加",
	"Toggle this to allow adding progress bars to regular list items (non-task bullets).":
		"通常のリストアイテム（非タスク箇条書き）にプログレスバーを追加できるようにするにはこれを切り替えてください。",
	"Add progress bar to Heading": "見出しにプログレスバーを追加",
	"Toggle this to allow this plugin to add progress bar for Task below the headings.":
		"見出しの下のタスクにプログレスバーを追加できるようにするにはこれを切り替えてください。",
	"Enable heading progress bars": "見出しプログレスバーを有効化",
	"Add progress bars to headings to show progress of all tasks under that heading.":
		"その見出しの下にあるすべてのタスクの進捗状況を表示するために、見出しにプログレスバーを追加します。",
	"Auto complete parent task": "親タスクを自動完了",
	"Toggle this to allow this plugin to auto complete parent task when all child tasks are completed.":
		"すべての子タスクが完了したときに親タスクを自動的に完了させるにはこれを切り替えてください。",
	"Mark parent as 'In Progress' when partially complete":
		"部分的に完了したら親を「進行中」としてマーク",
	"When some but not all child tasks are completed, mark the parent task as 'In Progress'. Only works when 'Auto complete parent' is enabled.":
		"一部の子タスクが完了しているが全部ではない場合、親タスクを「進行中」としてマークします。「親タスクを自動完了」が有効な場合のみ機能します。",
	"Count sub children level of current Task":
		"現在のタスクのサブ子レベルをカウント",
	"Toggle this to allow this plugin to count sub tasks.":
		"サブタスクをカウントできるようにするにはこれを切り替えてください。",
	"Task Status Settings": "タスクステータス設定",
	"Select a predefined task status collection or customize your own":
		"事前定義されたタスクステータスコレクションを選択するか、独自にカスタマイズしてください",
	"Completed task markers": "完了タスクマーカー",
	'Characters in square brackets that represent completed tasks. Example: "x|X"':
		'完了したタスクを表す角括弧内の文字。例："x|X"',
	"Planned task markers": "計画タスクマーカー",
	'Characters in square brackets that represent planned tasks. Example: "?"':
		'計画されたタスクを表す角括弧内の文字。例："?"',
	"In progress task markers": "進行中タスクマーカー",
	'Characters in square brackets that represent tasks in progress. Example: ">|/"':
		'進行中のタスクを表す角括弧内の文字。例：">|/"',
	"Abandoned task markers": "放棄タスクマーカー",
	'Characters in square brackets that represent abandoned tasks. Example: "-"':
		'放棄されたタスクを表す角括弧内の文字。例："-"',
	'Characters in square brackets that represent not started tasks. Default is space " "':
		'開始されていないタスクを表す角括弧内の文字。デフォルトはスペース " "',
	"Count other statuses as": "他のステータスをカウントする方法",
	'Select the status to count other statuses as. Default is "Not Started".':
		"他のステータスをカウントするステータスを選択します。デフォルトは「未開始」です。",
	"Task Counting Settings": "タスクカウント設定",
	"Exclude specific task markers": "特定のタスクマーカーを除外",
	'Specify task markers to exclude from counting. Example: "?|/"':
		'カウントから除外するタスクマーカーを指定します。例："?|/"',
	"Only count specific task markers": "特定のタスクマーカーのみをカウント",
	"Toggle this to only count specific task markers":
		"特定のタスクマーカーのみをカウントするにはこれを切り替えてください",
	"Specific task markers to count": "カウントする特定のタスクマーカー",
	'Specify which task markers to count. Example: "x|X|>|/"':
		'カウントするタスクマーカーを指定します。例："x|X|>|/"',
	"Conditional Progress Bar Display": "条件付きプログレスバー表示",
	"Hide progress bars based on conditions":
		"条件に基づいてプログレスバーを非表示",
	"Toggle this to enable hiding progress bars based on tags, folders, or metadata.":
		"タグ、フォルダ、またはメタデータに基づいてプログレスバーを非表示にするにはこれを切り替えてください。",
	"Hide by tags": "タグで非表示",
	'Specify tags that will hide progress bars (comma-separated, without #). Example: "no-progress-bar,hide-progress"':
		'プログレスバーを非表示にするタグを指定します（カンマ区切り、#なし）。例："no-progress-bar,hide-progress"',
	"Hide by folders": "フォルダで非表示",
	'Specify folder paths that will hide progress bars (comma-separated). Example: "Daily Notes,Projects/Hidden"':
		'プログレスバーを非表示にするフォルダパスを指定します（カンマ区切り）。例："Daily Notes,Projects/Hidden"',
	"Hide by metadata": "メタデータで非表示",
	'Specify frontmatter metadata that will hide progress bars. Example: "hide-progress-bar: true"':
		'プログレスバーを非表示にするフロントマターメタデータを指定します。例："hide-progress-bar: true"',
	"Task Status Switcher": "タスクステータススイッチャー",
	"Enable task status switcher": "タスクステータススイッチャーを有効化",
	"Enable/disable the ability to cycle through task states by clicking.":
		"クリックによるタスク状態の循環機能を有効/無効にします。",
	"Enable custom task marks": "カスタムタスクマークを有効化",
	"Replace default checkboxes with styled text marks that follow your task status cycle when clicked.":
		"デフォルトのチェックボックスを、クリック時にタスクステータスサイクルに従ってスタイル付きテキストマークに置き換えます。",
	"Enable cycle complete status": "サイクル完了ステータスを有効化",
	"Enable/disable the ability to automatically cycle through task states when pressing a mark.":
		"マークを押したときに自動的にタスク状態を循環する機能を有効/無効にします。",
	"Always cycle new tasks": "常に新しいタスクをサイクル",
	"When enabled, newly inserted tasks will immediately cycle to the next status. When disabled, newly inserted tasks with valid marks will keep their original mark.":
		"有効にすると、新しく挿入されたタスクは直ちに次のステータスに循環します。無効にすると、有効なマークを持つ新しく挿入されたタスクは元のマークを保持します。",
	"Task Status Cycle and Marks": "タスクステータスサイクルとマーク",
	"Define task states and their corresponding marks. The order from top to bottom defines the cycling sequence.":
		"タスク状態とそれに対応するマークを定義します。上から下への順序がサイクルの順序を定義します。",
	"Add Status": "ステータスを追加",
	"Completed Task Mover": "完了タスク移動ツール",
	"Enable completed task mover": "完了タスク移動ツールを有効化",
	"Toggle this to enable commands for moving completed tasks to another file.":
		"完了したタスクを別のファイルに移動するコマンドを有効にするにはこれを切り替えてください。",
	"Task marker type": "タスクマーカータイプ",
	"Choose what type of marker to add to moved tasks":
		"移動したタスクに追加するマーカーのタイプを選択",
	"Version marker text": "バージョンマーカーテキスト",
	"Text to append to tasks when moved (e.g., 'version 1.0')":
		"タスクを移動するときに追加するテキスト（例：'version 1.0'）",
	"Date marker text": "日付マーカーテキスト",
	"Text to append to tasks when moved (e.g., 'archived on 2023-12-31')":
		"タスクを移動するときに追加するテキスト（例：'archived on 2023-12-31'）",
	"Custom marker text": "カスタムマーカーテキスト",
	"Use {{DATE:format}} for date formatting (e.g., {{DATE:YYYY-MM-DD}}":
		"日付フォーマットには {{DATE:format}} を使用します（例：{{DATE:YYYY-MM-DD}}",
	"Treat abandoned tasks as completed": "放棄されたタスクを完了として扱う",
	"If enabled, abandoned tasks will be treated as completed.":
		"有効にすると、放棄されたタスクは完了として扱われます。",
	"Complete all moved tasks": "移動したすべてのタスクを完了",
	"If enabled, all moved tasks will be marked as completed.":
		"有効にすると、移動したすべてのタスクが完了としてマークされます。",
	"With current file link": "現在のファイルリンク付き",
	"A link to the current file will be added to the parent task of the moved tasks.":
		"移動したタスクの親タスクに現在のファイルへのリンクが追加されます。",
	"Say Thank You": "感謝の言葉",
	Donate: "寄付",
	"If you like this plugin, consider donating to support continued development:":
		"このプラグインが気に入ったら、継続的な開発をサポートするために寄付をご検討ください：",
	"Add number to the Progress Bar": "プログレスバーに数字を追加",
	"Toggle this to allow this plugin to add tasks number to progress bar.":
		"プログレスバーにタスク数を追加できるようにするにはこれを切り替えてください。",
	"Show percentage": "パーセンテージを表示",
	"Toggle this to allow this plugin to show percentage in the progress bar.":
		"プログレスバーにパーセンテージを表示できるようにするにはこれを切り替えてください。",
	"Customize progress text": "進捗テキストをカスタマイズ",
	"Toggle this to customize text representation for different progress percentage ranges.":
		"異なる進捗パーセンテージ範囲のテキスト表現をカスタマイズするにはこれを切り替えてください。",
	"Progress Ranges": "進捗範囲",
	"Define progress ranges and their corresponding text representations.":
		"進捗範囲とそれに対応するテキスト表現を定義します。",
	"Add new range": "新しい範囲を追加",
	"Add a new progress percentage range with custom text":
		"カスタムテキストで新しい進捗パーセンテージ範囲を追加",
	"Min percentage (0-100)": "最小パーセンテージ（0-100）",
	"Max percentage (0-100)": "最大パーセンテージ（0-100）",
	"Text template (use {{PROGRESS}})":
		"テキストテンプレート（{{PROGRESS}}を使用）",
	"Reset to defaults": "デフォルトにリセット",
	"Reset progress ranges to default values":
		"進捗範囲をデフォルト値にリセット",
	Reset: "リセット",
	"Priority Picker Settings": "優先度ピッカー設定",
	"Toggle to enable priority picker dropdown for emoji and letter format priorities.":
		"絵文字と文字形式の優先度のための優先度ピッカードロップダウンを有効にするには切り替えてください。",
	"Enable priority picker": "優先度ピッカーを有効化",
	"Enable priority keyboard shortcuts":
		"優先度キーボードショートカットを有効化",
	"Toggle to enable keyboard shortcuts for setting task priorities.":
		"タスクの優先度を設定するためのキーボードショートカットを有効にするには切り替えてください。",
	"Date picker": "日付ピッカー",
	"Enable date picker": "日付ピッカーを有効化",
	"Toggle this to enable date picker for tasks. This will add a calendar icon near your tasks which you can click to select a date.":
		"タスクの日付ピッカーを有効にするにはこれを切り替えてください。これにより、タスクの近くにカレンダーアイコンが追加され、クリックして日付を選択できます。",
	"Date mark": "日付マーク",
	"Emoji mark to identify dates. You can use multiple emoji separated by commas.":
		"日付を識別する絵文字マーク。カンマで区切って複数の絵文字を使用できます。",
	"Quick capture": "クイックキャプチャ",
	"Enable quick capture": "クイックキャプチャを有効化",
	"Toggle this to enable Org-mode style quick capture panel. Press Alt+C to open the capture panel.":
		"Org-modeスタイルのクイックキャプチャパネルを有効にするにはこれを切り替えてください。Alt+Cを押してキャプチャパネルを開きます。",
	"Target file": "ターゲットファイル",
	"The file where captured text will be saved. You can include a path, e.g., 'folder/Quick Capture.md'":
		"キャプチャしたテキストが保存されるファイル。パスを含めることができます。例：'folder/Quick Capture.md'",
	"Placeholder text": "プレースホルダーテキスト",
	"Placeholder text to display in the capture panel":
		"キャプチャパネルに表示するプレースホルダーテキスト",
	"Append to file": "ファイルに追加",
	"If enabled, captured text will be appended to the target file. If disabled, it will replace the file content.":
		"有効にすると、キャプチャしたテキストはターゲットファイルに追加されます。無効にすると、ファイルの内容が置き換えられます。",
	"Task Filter": "タスクフィルター",
	"Enable Task Filter": "タスクフィルターを有効化",
	"Toggle this to enable the task filter panel":
		"タスクフィルターパネルを有効にするにはこれを切り替えてください",
	"Preset Filters": "プリセットフィルター",
	"Create and manage preset filters for quick access to commonly used task filters.":
		"よく使用するタスクフィルターにすばやくアクセスするためのプリセットフィルターを作成および管理します。",
	"Edit Filter: ": "フィルターを編集：",
	"Filter name": "フィルター名",
	"Task Status": "タスクステータス",
	"Include or exclude tasks based on their status":
		"ステータスに基づいてタスクを含めるか除外する",
	"Include Completed Tasks": "完了タスクを含める",
	"Include In Progress Tasks": "進行中タスクを含める",
	"Include Abandoned Tasks": "放棄タスクを含める",
	"Include Not Started Tasks": "未開始タスクを含める",
	"Include Planned Tasks": "計画タスクを含める",
	"Related Tasks": "関連タスク",
	"Include parent, child, and sibling tasks in the filter":
		"フィルターに親、子、および兄弟タスクを含める",
	"Include Parent Tasks": "親タスクを含める",
	"Include Child Tasks": "子タスクを含める",
	"Include Sibling Tasks": "兄弟タスクを含める",
	"Advanced Filter": "高度なフィルター",
	"Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1'":
		"ブール演算を使用：AND、OR、NOT。例：'text content AND #tag1'",
	"Filter query": "フィルタークエリ",
	"Filter out tasks": "タスクをフィルタリング",
	"If enabled, tasks that match the query will be hidden, otherwise they will be shown":
		"有効にすると、クエリに一致するタスクは非表示になり、そうでなければ表示されます",
	Save: "保存",
	Cancel: "キャンセル",
	"Hide filter panel": "フィルターパネルを非表示",
	"Show filter panel": "フィルターパネルを表示",
	"Filter Tasks": "タスクをフィルター",
	"Preset filters": "プリセットフィルター",
	"Select a saved filter preset to apply":
		"適用する保存済みフィルタープリセットを選択",
	"Select a preset...": "プリセットを選択...",
	Query: "クエリ",
	"Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1 AND DATE:<2022-01-02 NOT PRIORITY:>=#B' - Supports >, <, =, >=, <=, != for PRIORITY and DATE.":
		"ブール演算を使用：AND、OR、NOT。例：'text content AND #tag1 AND DATE:<2022-01-02 NOT PRIORITY:>=#B' - PRIORITYとDATEには >、<、=、>=、<=、!= をサポートします。",
	"If true, tasks that match the query will be hidden, otherwise they will be shown":
		"trueの場合、クエリに一致するタスクは非表示になり、そうでなければ表示されます",
	Completed: "完了",
	"In Progress": "進行中",
	Abandoned: "放棄",
	"Not Started": "未開始",
	Planned: "計画済み",
	"Include Related Tasks": "関連タスクを含める",
	"Parent Tasks": "親タスク",
	"Child Tasks": "子タスク",
	"Sibling Tasks": "兄弟タスク",
	Apply: "適用",
	"New Preset": "新しいプリセット",
	"Preset saved": "プリセットを保存しました",
	"No changes to save": "保存する変更はありません",
	Close: "閉じる",
	"Capture to": "キャプチャ先",
	Capture: "キャプチャ",
	"Capture thoughts, tasks, or ideas...":
		"考え、タスク、アイデアをキャプチャ...",
	Tomorrow: "明日",
	"In 2 days": "2日後",
	"In 3 days": "3日後",
	"In 5 days": "5日後",
	"In 1 week": "1週間後",
	"In 10 days": "10日後",
	"In 2 weeks": "2週間後",
	"In 1 month": "1ヶ月後",
	"In 2 months": "2ヶ月後",
	"In 3 months": "3ヶ月後",
	"In 6 months": "6ヶ月後",
	"In 1 year": "1年後",
	"In 5 years": "5年後",
	"In 10 years": "10年後",
	"Highest priority": "最高優先度",
	"High priority": "高優先度",
	"Medium priority": "中優先度",
	"No priority": "無優先度",
	"Low priority": "低優先度",
	"Lowest priority": "最低優先度",
	"Priority A": "優先度A",
	"Priority B": "優先度B",
	"Priority C": "優先度C",
	"Task Priority": "タスク優先度",
	"Remove Priority": "優先度を削除",
	"Cycle task status forward": "タスクステータスを前に循環",
	"Cycle task status backward": "タスクステータスを後ろに循環",
	"Remove priority": "優先度を削除",
	"Move task to another file": "タスクを別のファイルに移動",
	"Move all completed subtasks to another file":
		"すべての完了したサブタスクを別のファイルに移動",
	"Move direct completed subtasks to another file":
		"直接完了したサブタスクを別のファイルに移動",
	"Move all subtasks to another file":
		"すべてのサブタスクを別のファイルに移動",
	"Set priority": "優先度を設定",
	"Toggle quick capture panel": "クイックキャプチャパネルを切り替え",
	"Quick capture (Global)": "クイックキャプチャ（グローバル）",
	"Toggle task filter panel": "タスクフィルターパネルを切り替え",
	"Filter Mode": "フィルターモード",
	"Choose whether to include or exclude tasks that match the filters":
		"タスクをフィルターする方法を選択します。",
	"Show matching tasks": "一致するタスクを表示",
	"Hide matching tasks": "一致するタスクを非表示",
	"Choose whether to show or hide tasks that match the filters":
		"タスクをフィルターする方法を選択します。",
	"Create new file:": "新しいファイルを作成：",
	"Completed tasks moved to": "完了したタスクの移動先",
	"Failed to create file:": "ファイルの作成に失敗しました：",
	"Beginning of file": "ファイルの先頭",
	"Failed to move tasks:": "タスクの移動に失敗しました：",
	"No active file found": "アクティブなファイルが見つかりません",
	"Task moved to": "タスクの移動先",
	"Failed to move task:": "タスクの移動に失敗しました：",
	"Nothing to capture": "キャプチャするものがありません",
	"Captured successfully": "キャプチャに成功しました",
	"Failed to save:": "保存に失敗しました：",
	"Captured successfully to": "キャプチャ先",
	Total: "合計",
	Workflow: "ワークフロー",
	"Add as workflow root": "ワークフローのルートとして追加",
	"Move to stage": "ステージに移動",
	"Complete stage": "ステージを完了",
	"Add child task with same stage": "同じステージの子タスクを追加",
	"Could not open quick capture panel in the current editor":
		"現在のエディタでクイックキャプチャパネルを開けませんでした",
	"Just started {{PROGRESS}}%": "開始したばかり {{PROGRESS}}%",
	"Making progress {{PROGRESS}}%": "進行中 {{PROGRESS}}%",
	"Half way {{PROGRESS}}%": "半分まで {{PROGRESS}}%",
	"Good progress {{PROGRESS}}%": "順調に進行中 {{PROGRESS}}%",
	"Almost there {{PROGRESS}}%": "もう少しで完了 {{PROGRESS}}%",
	"Progress bar": "進捗バー",
	"You can customize the progress bar behind the parent task(usually at the end of the task). You can also customize the progress bar for the task below the heading.":
		"親タスクの後ろの進捗バー（通常はタスクの最後）をカスタマイズできます。また、見出しの下のタスクの進捗バーもカスタマイズできます。",
	"Hide progress bars": "進捗バーを非表示",
	"Parent task changer": "親タスク変更ツール",
	"Change the parent task of the current task.":
		"現在のタスクの親タスクを変更します。",
	"No preset filters created yet. Click 'Add New Preset' to create one.":
		"プリセットフィルターがまだ作成されていません。「新しいプリセットを追加」をクリックして作成してください。",
	"Configure task workflows for project and process management":
		"プロジェクトとプロセス管理のためのタスクワークフローを設定",
	"Enable workflow": "ワークフローを有効化",
	"Toggle to enable the workflow system for tasks":
		"タスクのワークフローシステムを有効にする切り替え",
	"Auto-add timestamp": "タイムスタンプを自動追加",
	"Automatically add a timestamp to the task when it is created":
		"タスク作成時に自動的にタイムスタンプを追加",
	"Timestamp format:": "タイムスタンプ形式：",
	"Timestamp format": "タイムスタンプ形式",
	"Remove timestamp when moving to next stage":
		"次のステージに移動する際にタイムスタンプを削除",
	"Remove the timestamp from the current task when moving to the next stage":
		"次のステージに移動する際に現在のタスクからタイムスタンプを削除",
	"Calculate spent time": "経過時間を計算",
	"Calculate and display the time spent on the task when moving to the next stage":
		"次のステージに移動する際にタスクにかかった時間を計算して表示",
	"Format for spent time:": "経過時間の形式：",
	"Calculate spent time when move to next stage.":
		"次のステージに移動する際に経過時間を計算します。",
	"Spent time format": "経過時間の形式",
	"Calculate full spent time": "全経過時間を計算",
	"Calculate the full spent time from the start of the task to the last stage":
		"タスクの開始から最後のステージまでの全経過時間を計算",
	"Auto remove last stage marker": "最後のステージマーカーを自動削除",
	"Automatically remove the last stage marker when a task is completed":
		"タスクが完了したときに最後のステージマーカーを自動的に削除",
	"Auto-add next task": "次のタスクを自動追加",
	"Automatically create a new task with the next stage when completing a task":
		"タスクを完了する際に次のステージの新しいタスクを自動的に作成",
	"Workflow definitions": "ワークフロー定義",
	"Configure workflow templates for different types of processes":
		"異なるタイプのプロセス用のワークフローテンプレートを設定",
	"No workflow definitions created yet. Click 'Add New Workflow' to create one.":
		"ワークフロー定義がまだ作成されていません。「新しいワークフローを追加」をクリックして作成してください。",
	"Edit workflow": "ワークフローを編集",
	"Remove workflow": "ワークフローを削除",
	"Delete workflow": "ワークフローを削除",
	Delete: "削除",
	"Add New Workflow": "新しいワークフローを追加",
	"New Workflow": "新しいワークフロー",
	"Create New Workflow": "新しいワークフローを作成",
	"Workflow name": "ワークフロー名",
	"A descriptive name for the workflow": "ワークフローの説明的な名前",
	"Workflow ID": "ワークフローID",
	"A unique identifier for the workflow (used in tags)":
		"ワークフローの一意の識別子（タグで使用）",
	Description: "説明",
	"Optional description for the workflow": "ワークフローのオプション説明",
	"Describe the purpose and use of this workflow...":
		"このワークフローの目的と使用方法を説明...",
	"Workflow Stages": "ワークフローステージ",
	"No stages defined yet. Add a stage to get started.":
		"ステージがまだ定義されていません。ステージを追加して始めましょう。",
	Edit: "編集",
	"Move up": "上に移動",
	"Move down": "下に移動",
	"Sub-stage": "サブステージ",
	"Sub-stage name": "サブステージ名",
	"Sub-stage ID": "サブステージID",
	"Next: ": "次：",
	"Add Sub-stage": "サブステージを追加",
	"New Sub-stage": "新しいサブステージ",
	"Edit Stage": "ステージを編集",
	"Stage name": "ステージ名",
	"A descriptive name for this workflow stage":
		"このワークフローステージの説明的な名前",
	"Stage ID": "ステージID",
	"A unique identifier for the stage (used in tags)":
		"ステージの一意の識別子（タグで使用）",
	"Stage type": "ステージタイプ",
	"The type of this workflow stage": "このワークフローステージのタイプ",
	"Linear (sequential)": "線形（順次）",
	"Cycle (repeatable)": "サイクル（繰り返し可能）",
	"Terminal (end stage)": "終端（終了ステージ）",
	"Next stage": "次のステージ",
	"The stage to proceed to after this one": "このステージの後に進むステージ",
	"Sub-stages": "サブステージ",
	"Define cycle sub-stages (optional)":
		"サイクルサブステージを定義（オプション）",
	"No sub-stages defined yet.": "サブステージがまだ定義されていません。",
	"Can proceed to": "進むことができる先",
	"Additional stages that can follow this one (for right-click menu)":
		"このステージの後に続く追加のステージ（右クリックメニュー用）",
	"No additional destination stages defined.":
		"追加の目的地ステージが定義されていません。",
	Remove: "削除",
	Add: "追加",
	"Name and ID are required.": "名前とIDが必要です。",
	"End of file": "ファイルの終わり",
	"Include in cycle": "サイクルに含める",
	Preset: "プリセット",
	"Preset name": "プリセット名",
	"Edit Filter": "フィルターを編集",
	"Add New Preset": "新しいプリセットを追加",
	"New Filter": "新しいフィルター",
	"Reset to Default Presets": "デフォルトのプリセットにリセット",
	"This will replace all your current presets with the default set. Are you sure?":
		"これにより、現在のすべてのプリセットがデフォルトのセットに置き換えられます。よろしいですか？",
	"Edit Workflow": "ワークフローを編集",
	General: "一般",
	"Progress Bar": "進捗バー",
	"Task Mover": "タスク移動",
	"Quick Capture": "クイックキャプチャ",
	"Date & Priority": "日付と優先度",
	About: "について",
	"Count sub children of current Task":
		"現在のタスクのサブ子タスクをカウント",
	"Toggle this to allow this plugin to count sub tasks when generating progress bar\t.":
		"進捗バーを生成する際にサブタスクをカウントするためにこのプラグインを許可するには切り替えてください。",
	"Configure task status settings": "タスクステータス設定を構成",
	"Configure which task markers to count or exclude":
		"カウントまたは除外するタスクマーカーを構成",
	"Task status cycle and marks": "タスクステータスサイクルとマーク",
	"About Task Genius": "Task Geniusについて",
	Version: "バージョン",
	Documentation: "ドキュメント",
	"View the documentation for this plugin":
		"このプラグインのドキュメントを表示",
	"Open Documentation": "ドキュメントを開く",
	"Incomplete tasks": "未完了のタスク",
	"In progress tasks": "進行中のタスク",
	"Completed tasks": "完了したタスク",
	"All tasks": "すべてのタスク",
	"After heading": "見出しの後",
	"End of section": "セクションの終わり",
	"Enable text mark in source mode": "ソースモードでテキストマークを有効化",
	"Make the text mark in source mode follow the task status cycle when clicked.":
		"ソースモードでテキストマークをクリックするとタスクステータスサイクルに従う",
	"Status name": "ステータス名",
	"Progress display mode": "進捗表示モード",
	"Choose how to display task progress": "タスク進捗の表示方法を選択",
	"No progress indicators": "進捗インジケーターなし",
	"Graphical progress bar": "グラフィカル進捗バー",
	"Text progress indicator": "テキスト進捗インジケーター",
	"Both graphical and text": "グラフィカルとテキストの両方",
	"Toggle this to allow this plugin to count sub tasks when generating progress bar.":
		"進捗バーを生成する際にサブタスクをカウントするためにこのプラグインを許可するには切り替えてください。",
	"Progress format": "進捗フォーマット",
	"Choose how to display the task progress": "タスク進捗の表示方法を選択",
	"Percentage (75%)": "パーセンテージ (75%)",
	"Bracketed percentage ([75%])": "括弧付きパーセンテージ ([75%])",
	"Fraction (3/4)": "分数 (3/4)",
	"Bracketed fraction ([3/4])": "括弧付き分数 ([3/4])",
	"Detailed ([3✓ 1⟳ 0✗ 1? / 5])": "詳細 ([3✓ 1⟳ 0✗ 1? / 5])",
	"Custom format": "カスタムフォーマット",
	"Range-based text": "範囲ベースのテキスト",
	"Use placeholders like {{COMPLETED}}, {{TOTAL}}, {{PERCENT}}, etc.":
		"{{COMPLETED}}、{{TOTAL}}、{{PERCENT}}などのプレースホルダーを使用",
	"Preview:": "プレビュー：",
	"Available placeholders": "利用可能なプレースホルダー",
	"Available placeholders: {{COMPLETED}}, {{TOTAL}}, {{IN_PROGRESS}}, {{ABANDONED}}, {{PLANNED}}, {{NOT_STARTED}}, {{PERCENT}}, {{COMPLETED_SYMBOL}}, {{IN_PROGRESS_SYMBOL}}, {{ABANDONED_SYMBOL}}, {{PLANNED_SYMBOL}}":
		"利用可能なプレースホルダー：{{COMPLETED}}、{{TOTAL}}、{{IN_PROGRESS}}、{{ABANDONED}}、{{PLANNED}}、{{NOT_STARTED}}、{{PERCENT}}、{{COMPLETED_SYMBOL}}、{{IN_PROGRESS_SYMBOL}}、{{ABANDONED_SYMBOL}}、{{PLANNED_SYMBOL}}",
	"Expression examples": "表現例",
	"Examples of advanced formats using expressions":
		"表現を使用した高度なフォーマットの例",
	"Text Progress Bar": "テキスト進捗バー",
	"Emoji Progress Bar": "絵文字進捗バー",
	"Color-coded Status": "色分けされたステータス",
	"Status with Icons": "アイコン付きステータス",
	Preview: "プレビュー",
	Use: "使用",
	"Toggle this to show percentage instead of completed/total count.":
		"完了/合計カウントの代わりにパーセンテージを表示するには切り替えてください。",
	"Customize progress ranges": "進捗範囲をカスタマイズ",
	"Toggle this to customize the text for different progress ranges.":
		"異なる進捗範囲のテキストをカスタマイズするには切り替えてください。",
	"Apply Theme": "テーマを適用",
	"Back to main settings": "メイン設定に戻る",
	"Support expression in format, like using data.percentages to get the percentage of completed tasks. And using math or even repeat functions to get the result.":
		"フォーマットで式をサポートする、例えばdata.percentagesを使用して完了したタスクのパーセンテージを取得する。また、数学や繰り返し関数を使用して結果を取得する。",
	"Target File:": "対象ファイル：",
	"Task Properties": "タスクのプロパティ",
	"Start Date": "開始日",
	"Due Date": "期限日",
	"Scheduled Date": "予定日",
	Priority: "優先度",
	None: "なし",
	Highest: "最高",
	High: "高",
	Medium: "中",
	Low: "低",
	Lowest: "最低",
	Project: "プロジェクト",
	"Project name": "プロジェクト名",
	Context: "コンテキスト",
	Recurrence: "繰り返し",
	"e.g., every day, every week": "例：毎日、毎週",
	"Task Content": "タスク内容",
	"Task Details": "タスクの詳細",
	File: "ファイル",
	"Edit in File": "ファイルで編集",
	"Mark Incomplete": "未完了としてマーク",
	"Mark Complete": "完了としてマーク",
	"Task Title": "タスクタイトル",
	Tags: "タグ",
	"e.g. every day, every 2 weeks": "例：毎日、2週間ごと",
	Forecast: "予測",
	"0 actions, 0 projects": "0アクション、0プロジェクト",
	"Toggle list/tree view": "リスト/ツリービューの切り替え",
	"Focusing on Work": "作業に集中",
	Unfocus: "集中解除",
	"Past Due": "期限超過",
	Today: "今日",
	Future: "将来",
	actions: "アクション",
	project: "プロジェクト",
	"Coming Up": "今後の予定",
	Task: "タスク",
	Tasks: "タスク",
	"No upcoming tasks": "今後のタスクはありません",
	"No tasks scheduled": "予定されているタスクはありません",
	"0 tasks": "0タスク",
	"Filter tasks...": "タスクをフィルター...",
	Projects: "プロジェクト",
	"Toggle multi-select": "複数選択の切り替え",
	"No projects found": "プロジェクトが見つかりません",
	"projects selected": "プロジェクトが選択されました",
	tasks: "タスク",
	"No tasks in the selected projects":
		"選択したプロジェクトにタスクがありません",
	"Select a project to see related tasks":
		"関連タスクを表示するプロジェクトを選択してください",
	"Configure Review for": "レビューの設定：",
	"Review Frequency": "レビュー頻度",
	"How often should this project be reviewed":
		"このプロジェクトをどのくらいの頻度でレビューするか",
	"Custom...": "カスタム...",
	"e.g., every 3 months": "例：3ヶ月ごと",
	"Last Reviewed": "最終レビュー日",
	"Please specify a review frequency": "レビュー頻度を指定してください",
	"Review schedule updated for": "レビュースケジュールが更新されました：",
	"Review Projects": "プロジェクトのレビュー",
	"Select a project to review its tasks.":
		"タスクをレビューするプロジェクトを選択してください。",
	"Configured for Review": "レビュー設定済み",
	"Not Configured": "未設定",
	"No projects available.": "利用可能なプロジェクトがありません。",
	"Select a project to review.":
		"レビューするプロジェクトを選択してください。",
	"Show all tasks": "すべてのタスクを表示",
	"Showing all tasks, including completed tasks from previous reviews.":
		"以前のレビューで完了したタスクを含む、すべてのタスクを表示しています。",
	"Show only new and in-progress tasks": "新規および進行中のタスクのみ表示",
	"No tasks found for this project.":
		"このプロジェクトのタスクが見つかりません。",
	"Review every": "レビュー頻度",
	never: "なし",
	"Last reviewed": "最終レビュー日",
	"Mark as Reviewed": "レビュー済みとしてマーク",
	"No review schedule configured for this project":
		"このプロジェクトにはレビュースケジュールが設定されていません",
	"Configure Review Schedule": "レビュースケジュールを設定",
	"Project Review": "プロジェクトレビュー",
	"Select a project from the left sidebar to review its tasks.":
		"左サイドバーからプロジェクトを選択してタスクをレビューしてください。",
	Inbox: "受信トレイ",
	Flagged: "フラグ付き",
	Review: "レビュー",
	"tags selected": "タグが選択されました",
	"No tasks with the selected tags": "選択したタグのタスクがありません",
	"Select a tag to see related tasks":
		"関連タスクを表示するタグを選択してください",
	"Open Task Genius view": "Task Geniusビューを開く",
	"Task capture with metadata": "メタデータ付きタスクキャプチャ",
	"Refresh task index": "タスクインデックスを更新",
	"Refreshing task index...": "タスクインデックスを更新中...",
	"Task index refreshed": "タスクインデックスが更新されました",
	"Failed to refresh task index": "タスクインデックスの更新に失敗しました",
	"Force reindex all tasks": "すべてのタスクを強制的に再インデックス",
	"Clearing task cache and rebuilding index...":
		"タスクキャッシュをクリアしてインデックスを再構築中...",
	"Task index completely rebuilt":
		"タスクインデックスが完全に再構築されました",
	"Failed to force reindex tasks": "タスクの強制再インデックスに失敗しました",
	"Task Genius View": "Task Geniusビュー",
	"Toggle Sidebar": "サイドバーの切り替え",
	Details: "詳細",
	View: "ビュー",
	"Task Genius view is a comprehensive view that allows you to manage your tasks in a more efficient way.":
		"Task Geniusビューは、タスクをより効率的に管理できる包括的なビューです。",
	"Enable task genius view": "Task Geniusビューを有効にする",
	"Select a task to view details": "タスクを選択して詳細を表示",
	Status: "ステータス",
	"Comma separated": "カンマ区切り",
	Focus: "集中",
	"Loading more...": "読み込み中...",
	projects: "プロジェクト",
	"No tasks for this section.": "このセクションにはタスクがありません。",
	"No tasks found.": "タスクが見つかりません。",
	Complete: "完了",
	"Switch status": "ステータスを切り替える",
	"Rebuild index": "インデックスを再構築",
	Rebuild: "再構築",
	"0 tasks, 0 projects": "0タスク, 0プロジェクト",
	"New Custom View": "新しいカスタムビュー",
	"Create Custom View": "カスタムビューを作成",
	"Edit View: ": "ビューを編集：",
	"View Name": "ビュー名",
	"My Custom Task View": "My Custom Task View",
	"Icon Name": "アイコン名",
	"Enter any Lucide icon name (e.g., list-checks, filter, inbox)":
		"Lucideアイコン名を入力してください（例：list-checks、filter、inbox）",
	"Filter Rules": "フィルタールール",
	"Hide Completed and Abandoned Tasks":
		"完了したタスクと放棄したタスクを非表示",
	"Hide completed and abandoned tasks in this view.":
		"このビューで完了したタスクと放棄したタスクを非表示にします。",
	"Text Contains": "テキストを含む",
	"Filter tasks whose content includes this text (case-insensitive).":
		"このテキストを含むタスクをフィルタリングします（大文字小文字を区別しません）。",
	"Tags Include": "タグを含む",
	"Task must include ALL these tags (comma-separated).":
		"タスクはこれらのタグをすべて含む必要があります（カンマ区切り）。",
	"Tags Exclude": "タグを除外",
	"Task must NOT include ANY of these tags (comma-separated).":
		"タスクはこれらのタグのいずれも含んではいけません（カンマ区切り）。",
	"Project Is": "プロジェクトは",
	"Task must belong to this project (exact match).":
		"タスクはこのプロジェクトに属している必要があります（完全一致）。",
	"Priority Is": "優先度は",
	"Task must have this priority (e.g., 1, 2, 3).":
		"タスクはこの優先度を持つ必要があります（例：1、2、3）。",
	"Status Include": "ステータスを含む",
	"Task status must be one of these (comma-separated markers, e.g., /,>).":
		"タスクのステータスはこれらのいずれかである必要があります（カンマ区切りのマーカー、例：/,>）。",
	"Status Exclude": "ステータスを除外",
	"Task status must NOT be one of these (comma-separated markers, e.g., -,x).":
		"タスクのステータスはこれらのいずれでもあってはいけません（カンマ区切りのマーカー、例：-,x）。",
	"Use YYYY-MM-DD or relative terms like 'today', 'tomorrow', 'next week', 'last month'.":
		"YYYY-MM-DD形式または「今日」、「明日」、「来週」、「先月」などの相対的な用語を使用してください。",
	"Due Date Is": "期限日は",
	"Start Date Is": "開始日は",
	"Scheduled Date Is": "予定日は",
	"Path Includes": "パスを含む",
	"Task must contain this path (case-insensitive).":
		"タスクはこのパスを含む必要があります（大文字小文字を区別しません）。",
	"Path Excludes": "パスを除外",
	"Task must NOT contain this path (case-insensitive).":
		"タスクはこのパスを含んではいけません（大文字小文字を区別しません）。",
	"Unnamed View": "名前のないビュー",
	"View configuration saved.": "ビュー設定が保存されました。",
	"Hide Details": "詳細を非表示",
	"Show Details": "詳細を表示",
	"View Config": "ビュー設定",
	"View Configuration": "ビュー設定",
	"Configure the Task Genius sidebar views, visibility, order, and create custom views.":
		"Task Geniusサイドバービューの表示、順序、カスタムビューの作成を設定します。",
	"Manage Views": "ビューを管理",
	"Configure sidebar views, order, visibility, and hide/show completed tasks per view.":
		"サイドバービュー、順序、表示、ビューごとの完了タスクの表示/非表示を設定します。",
	"Show in sidebar": "サイドバーに表示",
	"Edit View": "ビューを編集",
	"Move Up": "上に移動",
	"Move Down": "下に移動",
	"Delete View": "ビューを削除",
	"Add Custom View": "カスタムビューを追加",
	"Error: View ID already exists.": "エラー：ビューIDはすでに存在します。",
	Events: "イベント",
	Plan: "プラン",
	Year: "年",
	Month: "月",
	Week: "週",
	Day: "日",
	Agenda: "アジェンダ",
	"Back to categories": "カテゴリーに戻る",
	"No matching options found": "一致するオプションが見つかりません",
	"No matching filters found": "一致するフィルターが見つかりません",
	Tag: "タグ",
	"File Path": "ファイルパス",
	"Add filter": "フィルターを追加",
	"Clear all": "すべてクリア",
	"Add Card": "カードを追加",
	"First Day of Week": "週の最初の日",
	"Overrides the locale default for calendar views.":
		"カレンダービューのロケールデフォルトを上書きします。",
	"Show checkbox": "チェックボックスを表示",
	"Show a checkbox for each task in the kanban view.":
		"かんばんビューの各タスクにチェックボックスを表示します。",
	"Locale Default": "ロケールデフォルト",
	"Use custom goal for progress bar": "プログレスバーにカスタム目標を使用",
	"Toggle this to allow this plugin to find the pattern g::number as goal of the parent task.":
		"このプラグインが親タスクの目標として g::number パターンを見つけられるようにするにはこれを切り替えてください。",
	"Prefer metadata format of task": "タスクのメタデータ形式を優先",
	"You can choose dataview format or tasks format, that will influence both index and save format.":
		"dataview形式またはtasks形式を選択できます。これはインデックスと保存形式の両方に影響します。",
	"Open in new tab": "新しいタブで開く",
	"Open settings": "設定を開く",
	"Hide in sidebar": "サイドバーに非表示",
	"No items found": "項目が見つかりません",
	"High Priority": "高優先度",
	"Medium Priority": "中優先度",
	"Low Priority": "低優先度",
	"No tasks in the selected items": "選択した項目にタスクがありません",
	"View Type": "ビュータイプ",
	"Select the type of view to create": "作成するビューのタイプを選択",
	"Standard View": "標準ビュー",
	"Two Column View": "2列ビュー",
	Items: "項目",
	"selected items": "選択された項目",
	"No items selected": "項目が選択されていません",
	"Two Column View Settings": "2列ビュー設定",
	"Group by Task Property": "タスクプロパティでグループ化",
	"Select which task property to use for left column grouping":
		"左列のグループ化に使用するタスクプロパティを選択",
	Priorities: "優先度",
	Contexts: "コンテキスト",
	"Due Dates": "期限日",
	"Scheduled Dates": "予定日",
	"Start Dates": "開始日",
	Files: "ファイル",
	"Left Column Title": "左列のタイトル",
	"Title for the left column (items list)": "左列のタイトル（項目リスト）",
	"Right Column Title": "右列のタイトル",
	"Default title for the right column (tasks list)":
		"右列のデフォルトタイトル（タスクリスト）",
	"Multi-select Text": "複数選択テキスト",
	"Text to show when multiple items are selected":
		"複数の項目が選択されたときに表示するテキスト",
	"Empty State Text": "空の状態テキスト",
	"Text to show when no items are selected":
		"項目が選択されていないときに表示するテキスト",
	"Filter Blanks": "空白をフィルター",
	"Filter out blank tasks in this view.":
		"このビューで空白のタスクを除外します。",
	"Task sorting is disabled or no sort criteria are defined in settings.":
		"タスクの並べ替えが無効になっているか、設定で並べ替え条件が定義されていません。",
	"e.g. #tag1, #tag2, #tag3": "例：#tag1, #tag2, #tag3",
	Overdue: "期限切れ",
	"No tasks found for this tag.": "このタグのタスクが見つかりません。",
	"New custom view": "新しいカスタムビュー",
	"Create custom view": "カスタムビューを作成",
	"Edit view: ": "ビューを編集：",
	"Icon name": "アイコン名",
	"First day of week": "週の最初の日",
	"Overrides the locale default for forecast views.":
		"予測ビューのロケールデフォルトを上書きします。",
	"View type": "ビュータイプ",
	"Standard view": "標準ビュー",
	"Two column view": "2列ビュー",
	"Two column view settings": "2列ビュー設定",
	"Group by task property": "タスクプロパティでグループ化",
	"Left column title": "左列のタイトル",
	"Right column title": "右列のタイトル",
	"Empty state text": "空の状態テキスト",
	"Hide completed and abandoned tasks":
		"完了したタスクと放棄されたタスクを非表示",
	"Filter blanks": "空白をフィルタリング",
	"Text contains": "テキストを含む",
	"Tags include": "タグを含む",
	"Tags exclude": "タグを除外",
	"Project is": "プロジェクトは",
	"Priority is": "優先度は",
	"Status include": "ステータスを含む",
	"Status exclude": "ステータスを除外",
	"Due date is": "期限日は",
	"Start date is": "開始日は",
	"Scheduled date is": "予定日は",
	"Path includes": "パスを含む",
	"Path excludes": "パスを除外",
	"Sort Criteria": "並べ替え条件",
	"Define the order in which tasks should be sorted. Criteria are applied sequentially.":
		"タスクを並べ替える順序を定義します。条件は順番に適用されます。",
	"No sort criteria defined. Add criteria below.":
		"並べ替え条件が定義されていません。以下に条件を追加してください。",
	Content: "内容",
	Ascending: "昇順",
	Descending: "降順",
	"Ascending: High -> Low -> None. Descending: None -> Low -> High":
		"昇順：高 -> 低 -> なし。降順：なし -> 低 -> 高",
	"Ascending: Earlier -> Later -> None. Descending: None -> Later -> Earlier":
		"昇順：早い -> 遅い -> なし。降順：なし -> 遅い -> 早い",
	"Ascending respects status order (Overdue first). Descending reverses it.":
		"昇順はステータス順（期限切れが最初）を尊重します。降順はそれを逆にします。",
	"Ascending: A-Z. Descending: Z-A": "昇順：A-Z。降順：Z-A",
	"Remove Criterion": "条件を削除",
	"Add Sort Criterion": "並べ替え条件を追加",
	"Reset to Defaults": "デフォルトにリセット",
	"Has due date": "期限日あり",
	"Has date": "日付あり",
	"No date": "日付なし",
	Any: "任意",
	"Has start date": "開始日あり",
	"Has scheduled date": "予定日あり",
	"Has created date": "作成日あり",
	"Has completed date": "完了日あり",
	"Only show tasks that match the completed date.":
		"完了日に一致するタスクのみを表示します。",
	"Has recurrence": "繰り返しあり",
	"Has property": "プロパティあり",
	"No property": "プロパティなし",
	"Unsaved Changes": "未保存の変更",
	"Sort Tasks in Section": "セクション内のタスクを並べ替え",
	"Tasks sorted (using settings). Change application needs refinement.":
		"タスクが並べ替えられました（設定を使用）。変更の適用には改良が必要です。",
	"Sort Tasks in Entire Document": "ドキュメント全体のタスクを並べ替え",
	"Entire document sorted (using settings).":
		"ドキュメント全体が並べ替えられました（設定を使用）。",
	"Tasks already sorted or no tasks found.":
		"タスクはすでに並べ替えられているか、タスクが見つかりません。",
	"Task Handler": "タスクハンドラー",
	"Show progress bars based on heading":
		"見出しに基づいてプログレスバーを表示",
	"Toggle this to enable showing progress bars based on heading.":
		"見出しに基づいてプログレスバーを表示するにはこれを切り替えてください。",
	"# heading": "# 見出し",
	"Task Sorting": "タスク並べ替え",
	"Configure how tasks are sorted in the document.":
		"ドキュメント内でタスクがどのように並べ替えられるかを設定します。",
	"Enable Task Sorting": "タスク並べ替えを有効にする",
	"Toggle this to enable commands for sorting tasks.":
		"タスクを並べ替えるコマンドを有効にするにはこれを切り替えてください。",
	"Use relative time for date": "日付に相対時間を使用",
	"Use relative time for date in task list item, e.g. 'yesterday', 'today', 'tomorrow', 'in 2 days', '3 months ago', etc.":
		"タスクリストアイテムの日付に相対時間を使用します。例：'昨日'、'今日'、'明日'、'2日後'、'3ヶ月前'など。",
	"Ignore all tasks behind heading": "見出しの後のすべてのタスクを無視",
	"Enter the heading to ignore, e.g. '## Project', '## Inbox', separated by comma":
		"無視する見出しを入力してください。例：'## プロジェクト'、'## 受信箱'、カンマで区切ります",
	"Focus all tasks behind heading": "見出しの後のすべてのタスクにフォーカス",
	"Enter the heading to focus, e.g. '## Project', '## Inbox', separated by comma":
		"フォーカスする見出しを入力してください。例：'## プロジェクト'、'## 受信箱'、カンマで区切ります",
	"Enable rewards": "報酬を有効にする",
	"Reward display type": "報酬表示タイプ",
	"Choose how rewards are displayed when earned.":
		"獲得時に報酬がどのように表示されるかを選択します。",
	"Modal dialog": "モーダルダイアログ",
	"Notice (Auto-accept)": "通知（自動受け入れ）",
	"Occurrence levels": "出現レベル",
	"Add occurrence level": "出現レベルを追加",
	"Reward items": "報酬アイテム",
	"Image url (optional)": "画像URL（任意）",
	"Delete reward item": "報酬アイテムを削除",
	"Add reward item": "報酬アイテムを追加",
	"(Optional) Trigger a notification when this value is reached":
		"（任意）この値に達したときに通知をトリガーする",
	"The property name in daily note front matter to store mapping values":
		"マッピング値を保存するデイリーノートのフロントマターのプロパティ名",
	"Value mapping": "値のマッピング",
	"Define mappings from numeric values to display text":
		"数値から表示テキストへのマッピングを定義",
	"Add new mapping": "新しいマッピングを追加",
	"Scheduled events": "スケジュールされたイベント",
	"Add multiple events that need to be completed":
		"完了する必要のある複数のイベントを追加",
	"Event name": "イベント名",
	"Event details": "イベントの詳細",
	"Add new event": "新しいイベントを追加",
	"Please enter a property name": "プロパティ名を入力してください",
	"Please add at least one mapping value":
		"少なくとも1つのマッピング値を追加してください",
	"Mapping key must be a number": "マッピングキーは数字である必要があります",
	"Please enter text for all mapping values":
		"すべてのマッピング値にテキストを入力してください",
	"Please add at least one event":
		"少なくとも1つのイベントを追加してください",
	"Event name cannot be empty": "イベント名は空にできません",
	"Add new habit": "新しい習慣を追加",
	"No habits yet": "まだ習慣がありません",
	"Click the button above to add your first habit":
		"上のボタンをクリックして最初の習慣を追加してください",
	"Habit updated": "習慣が更新されました",
	"Habit added": "習慣が追加されました",
	"Delete habit": "習慣を削除",
	"This action cannot be undone.": "このアクションは元に戻せません。",
	"Habit deleted": "習慣が削除されました",
	"You've Earned a Reward!": "報酬を獲得しました！",
	"Your reward:": "あなたの報酬：",
	"Image not found:": "画像が見つかりません：",
	"Claim Reward": "報酬を受け取る",
	Skip: "スキップ",
	Reward: "報酬",
	"View & Index Configuration": "ビュー＆インデックス設定",
	"Enable task genius view will also enable the task genius indexer, which will provide the task genius view results from whole vault.":
		"Task Genius ビューを有効にすると、Task Genius インデクサーも有効になり、保管庫全体から Task Genius ビューの結果が提供されます。",
	"Use daily note path as date": "デイリーノートのパスを日付として使用",
	"If enabled, the daily note path will be used as the date for tasks.":
		"有効にすると、デイリーノートのパスがタスクの日付として使用されます。",
	"Task Genius will use moment.js and also this format to parse the daily note path.":
		"Task Genius はmoment.jsとこの形式を使用してデイリーノートのパスを解析します。",
	"You need to set `yyyy` instead of `YYYY` in the format string. And `dd` instead of `DD`.":
		"形式文字列では `YYYY` の代わりに `yyyy` を、`DD` の代わりに `dd` を設定する必要があります。",
	"Daily note format": "デイリーノート形式",
	"Daily note path": "デイリーノートパス",
	"Select the folder that contains the daily note.":
		"デイリーノートを含むフォルダを選択してください。",
	"Use as date type": "日付タイプとして使用",
	"You can choose due, start, or scheduled as the date type for tasks.":
		"タスクの日付タイプとして、期限、開始、または予定を選択できます。",
	Due: "期限",
	Start: "開始",
	Scheduled: "予定",
	Rewards: "報酬",
	"Configure rewards for completing tasks. Define items, their occurrence chances, and conditions.":
		"タスク完了の報酬を設定します。アイテム、出現確率、条件を定義します。",
	"Enable Rewards": "報酬を有効にする",
	"Toggle to enable or disable the reward system.":
		"報酬システムを有効または無効にするトグル。",
	"Occurrence Levels": "出現レベル",
	"Define different levels of reward rarity and their probability.":
		"報酬のレア度とその確率の異なるレベルを定義します。",
	"Chance must be between 0 and 100.":
		"確率は0から100の間である必要があります。",
	"Level Name (e.g., common)": "レベル名（例：一般）",
	"Chance (%)": "確率（%）",
	"Delete Level": "レベルを削除",
	"Add Occurrence Level": "出現レベルを追加",
	"New Level": "新しいレベル",
	"Reward Items": "報酬アイテム",
	"Manage the specific rewards that can be obtained.":
		"獲得できる特定の報酬を管理します。",
	"No levels defined": "レベルが定義されていません",
	"Reward Name/Text": "報酬名/テキスト",
	"Inventory (-1 for ∞)": "在庫（-1で∞）",
	"Invalid inventory number.": "無効な在庫数です。",
	"Condition (e.g., #tag AND project)": "条件（例：#タグ AND プロジェクト）",
	"Image URL (optional)": "画像URL（任意）",
	"Delete Reward Item": "報酬アイテムを削除",
	"No reward items defined yet.": "報酬アイテムがまだ定義されていません。",
	"Add Reward Item": "報酬アイテムを追加",
	"New Reward": "新しい報酬",
	"Configure habit settings, including adding new habits, editing existing habits, and managing habit completion.":
		"習慣設定を構成します。新しい習慣の追加、既存の習慣の編集、習慣の完了管理を含みます。",
	"Enable habits": "習慣を有効にする",
};

export default translations;
