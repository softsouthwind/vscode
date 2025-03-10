/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * This is the place for API experiments and proposals.
 * These API are NOT stable and subject to change. They are only available in the Insiders
 * distribution and CANNOT be used in published extensions.
 *
 * To test these API in local environment:
 * - Use Insiders release of VS Code.
 * - Add `"enableProposedApi": true` to your package.json.
 * - Copy this file to your project.
 */

declare module 'vscode' {

	//#region auth provider: https://github.com/microsoft/vscode/issues/88309

	/**
	 * An [event](#Event) which fires when an [AuthenticationProvider](#AuthenticationProvider) is added or removed.
	 */
	export interface AuthenticationProvidersChangeEvent {
		/**
		 * The ids of the [authenticationProvider](#AuthenticationProvider)s that have been added.
		 */
		readonly added: ReadonlyArray<AuthenticationProviderInformation>;

		/**
		 * The ids of the [authenticationProvider](#AuthenticationProvider)s that have been removed.
		 */
		readonly removed: ReadonlyArray<AuthenticationProviderInformation>;
	}

	export namespace authentication {
		/**
		 * @deprecated - getSession should now trigger extension activation.
		 * Fires with the provider id that was registered or unregistered.
		 */
		export const onDidChangeAuthenticationProviders: Event<AuthenticationProvidersChangeEvent>;

		/**
		 * @deprecated
		 * An array of the information of authentication providers that are currently registered.
		 */
		export const providers: ReadonlyArray<AuthenticationProviderInformation>;

		/**
		 * @deprecated
		 * Logout of a specific session.
		 * @param providerId The id of the provider to use
		 * @param sessionId The session id to remove
		 * provider
		 */
		export function logout(providerId: string, sessionId: string): Thenable<void>;
	}

	//#endregion

	// eslint-disable-next-line vscode-dts-region-comments
	//#region @alexdima - resolvers

	export interface MessageOptions {
		/**
		 * Do not render a native message box.
		 */
		useCustom?: boolean;
	}

	export interface RemoteAuthorityResolverContext {
		resolveAttempt: number;
	}

	export class ResolvedAuthority {
		readonly host: string;
		readonly port: number;
		readonly connectionToken: string | undefined;

		constructor(host: string, port: number, connectionToken?: string);
	}

	export interface ResolvedOptions {
		extensionHostEnv?: { [key: string]: string | null; };
	}

	export interface TunnelOptions {
		remoteAddress: { port: number, host: string; };
		// The desired local port. If this port can't be used, then another will be chosen.
		localAddressPort?: number;
		label?: string;
		public?: boolean;
	}

	export interface TunnelDescription {
		remoteAddress: { port: number, host: string; };
		//The complete local address(ex. localhost:1234)
		localAddress: { port: number, host: string; } | string;
		public?: boolean;
	}

	export interface Tunnel extends TunnelDescription {
		// Implementers of Tunnel should fire onDidDispose when dispose is called.
		onDidDispose: Event<void>;
		dispose(): void | Thenable<void>;
	}

	/**
	 * Used as part of the ResolverResult if the extension has any candidate,
	 * published, or forwarded ports.
	 */
	export interface TunnelInformation {
		/**
		 * Tunnels that are detected by the extension. The remotePort is used for display purposes.
		 * The localAddress should be the complete local address (ex. localhost:1234) for connecting to the port. Tunnels provided through
		 * detected are read-only from the forwarded ports UI.
		 */
		environmentTunnels?: TunnelDescription[];

	}

	export interface TunnelCreationOptions {
		/**
		 * True when the local operating system will require elevation to use the requested local port.
		 */
		elevationRequired?: boolean;
	}

	export enum CandidatePortSource {
		None = 0,
		Process = 1,
		Output = 2
	}

	export type ResolverResult = ResolvedAuthority & ResolvedOptions & TunnelInformation;

	export class RemoteAuthorityResolverError extends Error {
		static NotAvailable(message?: string, handled?: boolean): RemoteAuthorityResolverError;
		static TemporarilyNotAvailable(message?: string): RemoteAuthorityResolverError;

		constructor(message?: string);
	}

	export interface RemoteAuthorityResolver {
		resolve(authority: string, context: RemoteAuthorityResolverContext): ResolverResult | Thenable<ResolverResult>;
		/**
		 * Can be optionally implemented if the extension can forward ports better than the core.
		 * When not implemented, the core will use its default forwarding logic.
		 * When implemented, the core will use this to forward ports.
		 *
		 * To enable the "Change Local Port" action on forwarded ports, make sure to set the `localAddress` of
		 * the returned `Tunnel` to a `{ port: number, host: string; }` and not a string.
		 */
		tunnelFactory?: (tunnelOptions: TunnelOptions, tunnelCreationOptions: TunnelCreationOptions) => Thenable<Tunnel> | undefined;

		/**p
		 * Provides filtering for candidate ports.
		 */
		showCandidatePort?: (host: string, port: number, detail: string) => Thenable<boolean>;

		/**
		 * Lets the resolver declare which tunnel factory features it supports.
		 * UNDER DISCUSSION! MAY CHANGE SOON.
		 */
		tunnelFeatures?: {
			elevation: boolean;
			public: boolean;
		};

		candidatePortSource?: CandidatePortSource;
	}

	export namespace workspace {
		/**
		 * Forwards a port. If the current resolver implements RemoteAuthorityResolver:forwardPort then that will be used to make the tunnel.
		 * By default, openTunnel only support localhost; however, RemoteAuthorityResolver:tunnelFactory can be used to support other ips.
		 *
		 * @throws When run in an environment without a remote.
		 *
		 * @param tunnelOptions The `localPort` is a suggestion only. If that port is not available another will be chosen.
		 */
		export function openTunnel(tunnelOptions: TunnelOptions): Thenable<Tunnel>;

		/**
		 * Gets an array of the currently available tunnels. This does not include environment tunnels, only tunnels that have been created by the user.
		 * Note that these are of type TunnelDescription and cannot be disposed.
		 */
		export let tunnels: Thenable<TunnelDescription[]>;

		/**
		 * Fired when the list of tunnels has changed.
		 */
		export const onDidChangeTunnels: Event<void>;
	}

	export interface ResourceLabelFormatter {
		scheme: string;
		authority?: string;
		formatting: ResourceLabelFormatting;
	}

	export interface ResourceLabelFormatting {
		label: string; // myLabel:/${path}
		// For historic reasons we use an or string here. Once we finalize this API we should start using enums instead and adopt it in extensions.
		// eslint-disable-next-line vscode-dts-literal-or-types
		separator: '/' | '\\' | '';
		tildify?: boolean;
		normalizeDriveLetter?: boolean;
		workspaceSuffix?: string;
		authorityPrefix?: string;
		stripPathStartingSeparator?: boolean;
	}

	export namespace workspace {
		export function registerRemoteAuthorityResolver(authorityPrefix: string, resolver: RemoteAuthorityResolver): Disposable;
		export function registerResourceLabelFormatter(formatter: ResourceLabelFormatter): Disposable;
	}

	//#endregion

	//#region editor insets: https://github.com/microsoft/vscode/issues/85682

	export interface WebviewEditorInset {
		readonly editor: TextEditor;
		readonly line: number;
		readonly height: number;
		readonly webview: Webview;
		readonly onDidDispose: Event<void>;
		dispose(): void;
	}

	export namespace window {
		export function createWebviewTextEditorInset(editor: TextEditor, line: number, height: number, options?: WebviewOptions): WebviewEditorInset;
	}

	//#endregion

	//#region read/write in chunks: https://github.com/microsoft/vscode/issues/84515

	export interface FileSystemProvider {
		open?(resource: Uri, options: { create: boolean; }): number | Thenable<number>;
		close?(fd: number): void | Thenable<void>;
		read?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): number | Thenable<number>;
		write?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): number | Thenable<number>;
	}

	//#endregion

	//#region TextSearchProvider: https://github.com/microsoft/vscode/issues/59921

	/**
	 * The parameters of a query for text search.
	 */
	export interface TextSearchQuery {
		/**
		 * The text pattern to search for.
		 */
		pattern: string;

		/**
		 * Whether or not `pattern` should match multiple lines of text.
		 */
		isMultiline?: boolean;

		/**
		 * Whether or not `pattern` should be interpreted as a regular expression.
		 */
		isRegExp?: boolean;

		/**
		 * Whether or not the search should be case-sensitive.
		 */
		isCaseSensitive?: boolean;

		/**
		 * Whether or not to search for whole word matches only.
		 */
		isWordMatch?: boolean;
	}

	/**
	 * A file glob pattern to match file paths against.
	 * TODO@roblourens merge this with the GlobPattern docs/definition in vscode.d.ts.
	 * @see [GlobPattern](#GlobPattern)
	 */
	export type GlobString = string;

	/**
	 * Options common to file and text search
	 */
	export interface SearchOptions {
		/**
		 * The root folder to search within.
		 */
		folder: Uri;

		/**
		 * Files that match an `includes` glob pattern should be included in the search.
		 */
		includes: GlobString[];

		/**
		 * Files that match an `excludes` glob pattern should be excluded from the search.
		 */
		excludes: GlobString[];

		/**
		 * Whether external files that exclude files, like .gitignore, should be respected.
		 * See the vscode setting `"search.useIgnoreFiles"`.
		 */
		useIgnoreFiles: boolean;

		/**
		 * Whether symlinks should be followed while searching.
		 * See the vscode setting `"search.followSymlinks"`.
		 */
		followSymlinks: boolean;

		/**
		 * Whether global files that exclude files, like .gitignore, should be respected.
		 * See the vscode setting `"search.useGlobalIgnoreFiles"`.
		 */
		useGlobalIgnoreFiles: boolean;
	}

	/**
	 * Options to specify the size of the result text preview.
	 * These options don't affect the size of the match itself, just the amount of preview text.
	 */
	export interface TextSearchPreviewOptions {
		/**
		 * The maximum number of lines in the preview.
		 * Only search providers that support multiline search will ever return more than one line in the match.
		 */
		matchLines: number;

		/**
		 * The maximum number of characters included per line.
		 */
		charsPerLine: number;
	}

	/**
	 * Options that apply to text search.
	 */
	export interface TextSearchOptions extends SearchOptions {
		/**
		 * The maximum number of results to be returned.
		 */
		maxResults: number;

		/**
		 * Options to specify the size of the result text preview.
		 */
		previewOptions?: TextSearchPreviewOptions;

		/**
		 * Exclude files larger than `maxFileSize` in bytes.
		 */
		maxFileSize?: number;

		/**
		 * Interpret files using this encoding.
		 * See the vscode setting `"files.encoding"`
		 */
		encoding?: string;

		/**
		 * Number of lines of context to include before each match.
		 */
		beforeContext?: number;

		/**
		 * Number of lines of context to include after each match.
		 */
		afterContext?: number;
	}

	/**
	 * Information collected when text search is complete.
	 */
	export interface TextSearchComplete {
		/**
		 * Whether the search hit the limit on the maximum number of search results.
		 * `maxResults` on [`TextSearchOptions`](#TextSearchOptions) specifies the max number of results.
		 * - If exactly that number of matches exist, this should be false.
		 * - If `maxResults` matches are returned and more exist, this should be true.
		 * - If search hits an internal limit which is less than `maxResults`, this should be true.
		 */
		limitHit?: boolean;
	}

	/**
	 * A preview of the text result.
	 */
	export interface TextSearchMatchPreview {
		/**
		 * The matching lines of text, or a portion of the matching line that contains the match.
		 */
		text: string;

		/**
		 * The Range within `text` corresponding to the text of the match.
		 * The number of matches must match the TextSearchMatch's range property.
		 */
		matches: Range | Range[];
	}

	/**
	 * A match from a text search
	 */
	export interface TextSearchMatch {
		/**
		 * The uri for the matching document.
		 */
		uri: Uri;

		/**
		 * The range of the match within the document, or multiple ranges for multiple matches.
		 */
		ranges: Range | Range[];

		/**
		 * A preview of the text match.
		 */
		preview: TextSearchMatchPreview;
	}

	/**
	 * A line of context surrounding a TextSearchMatch.
	 */
	export interface TextSearchContext {
		/**
		 * The uri for the matching document.
		 */
		uri: Uri;

		/**
		 * One line of text.
		 * previewOptions.charsPerLine applies to this
		 */
		text: string;

		/**
		 * The line number of this line of context.
		 */
		lineNumber: number;
	}

	export type TextSearchResult = TextSearchMatch | TextSearchContext;

	/**
	 * A TextSearchProvider provides search results for text results inside files in the workspace.
	 */
	export interface TextSearchProvider {
		/**
		 * Provide results that match the given text pattern.
		 * @param query The parameters for this query.
		 * @param options A set of options to consider while searching.
		 * @param progress A progress callback that must be invoked for all results.
		 * @param token A cancellation token.
		 */
		provideTextSearchResults(query: TextSearchQuery, options: TextSearchOptions, progress: Progress<TextSearchResult>, token: CancellationToken): ProviderResult<TextSearchComplete>;
	}

	//#endregion

	//#region FileSearchProvider: https://github.com/microsoft/vscode/issues/73524

	/**
	 * The parameters of a query for file search.
	 */
	export interface FileSearchQuery {
		/**
		 * The search pattern to match against file paths.
		 */
		pattern: string;
	}

	/**
	 * Options that apply to file search.
	 */
	export interface FileSearchOptions extends SearchOptions {
		/**
		 * The maximum number of results to be returned.
		 */
		maxResults?: number;

		/**
		 * A CancellationToken that represents the session for this search query. If the provider chooses to, this object can be used as the key for a cache,
		 * and searches with the same session object can search the same cache. When the token is cancelled, the session is complete and the cache can be cleared.
		 */
		session?: CancellationToken;
	}

	/**
	 * A FileSearchProvider provides search results for files in the given folder that match a query string. It can be invoked by quickopen or other extensions.
	 *
	 * A FileSearchProvider is the more powerful of two ways to implement file search in VS Code. Use a FileSearchProvider if you wish to search within a folder for
	 * all files that match the user's query.
	 *
	 * The FileSearchProvider will be invoked on every keypress in quickopen. When `workspace.findFiles` is called, it will be invoked with an empty query string,
	 * and in that case, every file in the folder should be returned.
	 */
	export interface FileSearchProvider {
		/**
		 * Provide the set of files that match a certain file path pattern.
		 * @param query The parameters for this query.
		 * @param options A set of options to consider while searching files.
		 * @param token A cancellation token.
		 */
		provideFileSearchResults(query: FileSearchQuery, options: FileSearchOptions, token: CancellationToken): ProviderResult<Uri[]>;
	}

	export namespace workspace {
		/**
		 * Register a search provider.
		 *
		 * Only one provider can be registered per scheme.
		 *
		 * @param scheme The provider will be invoked for workspace folders that have this file scheme.
		 * @param provider The provider.
		 * @return A [disposable](#Disposable) that unregisters this provider when being disposed.
		 */
		export function registerFileSearchProvider(scheme: string, provider: FileSearchProvider): Disposable;

		/**
		 * Register a text search provider.
		 *
		 * Only one provider can be registered per scheme.
		 *
		 * @param scheme The provider will be invoked for workspace folders that have this file scheme.
		 * @param provider The provider.
		 * @return A [disposable](#Disposable) that unregisters this provider when being disposed.
		 */
		export function registerTextSearchProvider(scheme: string, provider: TextSearchProvider): Disposable;
	}

	//#endregion

	//#region findTextInFiles: https://github.com/microsoft/vscode/issues/59924

	/**
	 * Options that can be set on a findTextInFiles search.
	 */
	export interface FindTextInFilesOptions {
		/**
		 * A [glob pattern](#GlobPattern) that defines the files to search for. The glob pattern
		 * will be matched against the file paths of files relative to their workspace. Use a [relative pattern](#RelativePattern)
		 * to restrict the search results to a [workspace folder](#WorkspaceFolder).
		 */
		include?: GlobPattern;

		/**
		 * A [glob pattern](#GlobPattern) that defines files and folders to exclude. The glob pattern
		 * will be matched against the file paths of resulting matches relative to their workspace. When `undefined`, default excludes will
		 * apply.
		 */
		exclude?: GlobPattern;

		/**
		 * Whether to use the default and user-configured excludes. Defaults to true.
		 */
		useDefaultExcludes?: boolean;

		/**
		 * The maximum number of results to search for
		 */
		maxResults?: number;

		/**
		 * Whether external files that exclude files, like .gitignore, should be respected.
		 * See the vscode setting `"search.useIgnoreFiles"`.
		 */
		useIgnoreFiles?: boolean;

		/**
		 * Whether global files that exclude files, like .gitignore, should be respected.
		 * See the vscode setting `"search.useGlobalIgnoreFiles"`.
		 */
		useGlobalIgnoreFiles?: boolean;

		/**
		 * Whether symlinks should be followed while searching.
		 * See the vscode setting `"search.followSymlinks"`.
		 */
		followSymlinks?: boolean;

		/**
		 * Interpret files using this encoding.
		 * See the vscode setting `"files.encoding"`
		 */
		encoding?: string;

		/**
		 * Options to specify the size of the result text preview.
		 */
		previewOptions?: TextSearchPreviewOptions;

		/**
		 * Number of lines of context to include before each match.
		 */
		beforeContext?: number;

		/**
		 * Number of lines of context to include after each match.
		 */
		afterContext?: number;
	}

	export namespace workspace {
		/**
		 * Search text in files across all [workspace folders](#workspace.workspaceFolders) in the workspace.
		 * @param query The query parameters for the search - the search string, whether it's case-sensitive, or a regex, or matches whole words.
		 * @param callback A callback, called for each result
		 * @param token A token that can be used to signal cancellation to the underlying search engine.
		 * @return A thenable that resolves when the search is complete.
		 */
		export function findTextInFiles(query: TextSearchQuery, callback: (result: TextSearchResult) => void, token?: CancellationToken): Thenable<TextSearchComplete>;

		/**
		 * Search text in files across all [workspace folders](#workspace.workspaceFolders) in the workspace.
		 * @param query The query parameters for the search - the search string, whether it's case-sensitive, or a regex, or matches whole words.
		 * @param options An optional set of query options. Include and exclude patterns, maxResults, etc.
		 * @param callback A callback, called for each result
		 * @param token A token that can be used to signal cancellation to the underlying search engine.
		 * @return A thenable that resolves when the search is complete.
		 */
		export function findTextInFiles(query: TextSearchQuery, options: FindTextInFilesOptions, callback: (result: TextSearchResult) => void, token?: CancellationToken): Thenable<TextSearchComplete>;
	}

	//#endregion

	//#region diff command: https://github.com/microsoft/vscode/issues/84899

	/**
	 * The contiguous set of modified lines in a diff.
	 */
	export interface LineChange {
		readonly originalStartLineNumber: number;
		readonly originalEndLineNumber: number;
		readonly modifiedStartLineNumber: number;
		readonly modifiedEndLineNumber: number;
	}

	export namespace commands {

		/**
		 * Registers a diff information command that can be invoked via a keyboard shortcut,
		 * a menu item, an action, or directly.
		 *
		 * Diff information commands are different from ordinary [commands](#commands.registerCommand) as
		 * they only execute when there is an active diff editor when the command is called, and the diff
		 * information has been computed. Also, the command handler of an editor command has access to
		 * the diff information.
		 *
		 * @param command A unique identifier for the command.
		 * @param callback A command handler function with access to the [diff information](#LineChange).
		 * @param thisArg The `this` context used when invoking the handler function.
		 * @return Disposable which unregisters this command on disposal.
		 */
		export function registerDiffInformationCommand(command: string, callback: (diff: LineChange[], ...args: any[]) => any, thisArg?: any): Disposable;
	}

	//#endregion

	// eslint-disable-next-line vscode-dts-region-comments
	//#region @weinand: variables view action contributions

	/**
	 * A DebugProtocolVariableContainer is an opaque stand-in type for the intersection of the Scope and Variable types defined in the Debug Adapter Protocol.
	 * See https://microsoft.github.io/debug-adapter-protocol/specification#Types_Scope and https://microsoft.github.io/debug-adapter-protocol/specification#Types_Variable.
	 */
	export interface DebugProtocolVariableContainer {
		// Properties: the intersection of DAP's Scope and Variable types.
	}

	/**
	 * A DebugProtocolVariable is an opaque stand-in type for the Variable type defined in the Debug Adapter Protocol.
	 * See https://microsoft.github.io/debug-adapter-protocol/specification#Types_Variable.
	 */
	export interface DebugProtocolVariable {
		// Properties: see details [here](https://microsoft.github.io/debug-adapter-protocol/specification#Base_Protocol_Variable).
	}

	//#endregion

	// eslint-disable-next-line vscode-dts-region-comments
	//#region @joaomoreno: SCM validation

	/**
	 * Represents the validation type of the Source Control input.
	 */
	export enum SourceControlInputBoxValidationType {

		/**
		 * Something not allowed by the rules of a language or other means.
		 */
		Error = 0,

		/**
		 * Something suspicious but allowed.
		 */
		Warning = 1,

		/**
		 * Something to inform about but not a problem.
		 */
		Information = 2
	}

	export interface SourceControlInputBoxValidation {

		/**
		 * The validation message to display.
		 */
		readonly message: string;

		/**
		 * The validation type.
		 */
		readonly type: SourceControlInputBoxValidationType;
	}

	/**
	 * Represents the input box in the Source Control viewlet.
	 */
	export interface SourceControlInputBox {

		/**
		 * A validation function for the input box. It's possible to change
		 * the validation provider simply by setting this property to a different function.
		 */
		validateInput?(value: string, cursorPosition: number): ProviderResult<SourceControlInputBoxValidation | undefined | null>;
	}

	//#endregion

	// eslint-disable-next-line vscode-dts-region-comments
	//#region @joaomoreno: SCM selected provider

	export interface SourceControl {

		/**
		 * Whether the source control is selected.
		 */
		readonly selected: boolean;

		/**
		 * An event signaling when the selection state changes.
		 */
		readonly onDidChangeSelection: Event<boolean>;
	}

	//#endregion

	//#region Terminal data write event https://github.com/microsoft/vscode/issues/78502

	export interface TerminalDataWriteEvent {
		/**
		 * The [terminal](#Terminal) for which the data was written.
		 */
		readonly terminal: Terminal;
		/**
		 * The data being written.
		 */
		readonly data: string;
	}

	namespace window {
		/**
		 * An event which fires when the terminal's child pseudo-device is written to (the shell).
		 * In other words, this provides access to the raw data stream from the process running
		 * within the terminal, including VT sequences.
		 */
		export const onDidWriteTerminalData: Event<TerminalDataWriteEvent>;
	}

	//#endregion

	//#region Terminal dimensions property and change event https://github.com/microsoft/vscode/issues/55718

	/**
	 * An [event](#Event) which fires when a [Terminal](#Terminal)'s dimensions change.
	 */
	export interface TerminalDimensionsChangeEvent {
		/**
		 * The [terminal](#Terminal) for which the dimensions have changed.
		 */
		readonly terminal: Terminal;
		/**
		 * The new value for the [terminal's dimensions](#Terminal.dimensions).
		 */
		readonly dimensions: TerminalDimensions;
	}

	export namespace window {
		/**
		 * An event which fires when the [dimensions](#Terminal.dimensions) of the terminal change.
		 */
		export const onDidChangeTerminalDimensions: Event<TerminalDimensionsChangeEvent>;
	}

	export interface Terminal {
		/**
		 * The current dimensions of the terminal. This will be `undefined` immediately after the
		 * terminal is created as the dimensions are not known until shortly after the terminal is
		 * created.
		 */
		readonly dimensions: TerminalDimensions | undefined;
	}

	//#endregion

	//#region Terminal initial text https://github.com/microsoft/vscode/issues/120368

	export interface TerminalOptions {
		/**
		 * Initial text to write to the terminal, note that this is not sent to the process but
		 * rather written directly to the terminal. This supports escape sequences such a setting
		 * text style.
		 */
		readonly initialText?: string;
	}

	//#endregion

	//#region Terminal icon https://github.com/microsoft/vscode/issues/120538

	export interface TerminalOptions {
		/**
		 * A codicon ID to associate with this terminal.
		 */
		readonly icon?: string;
	}

	//#endregion

	// eslint-disable-next-line vscode-dts-region-comments
	//#region @jrieken -> exclusive document filters

	export interface DocumentFilter {
		readonly exclusive?: boolean;
	}

	//#endregion

	//#region Tree View: https://github.com/microsoft/vscode/issues/61313 @alexr00
	export interface TreeView<T> extends Disposable {
		reveal(element: T | undefined, options?: { select?: boolean, focus?: boolean, expand?: boolean | number; }): Thenable<void>;
	}
	//#endregion

	//#region Task presentation group: https://github.com/microsoft/vscode/issues/47265
	export interface TaskPresentationOptions {
		/**
		 * Controls whether the task is executed in a specific terminal group using split panes.
		 */
		group?: string;
	}
	//#endregion

	//#region Status bar item with ID and Name: https://github.com/microsoft/vscode/issues/74972

	/**
	 * Options to configure the status bar item.
	 */
	export interface StatusBarItemOptions {

		/**
		 * A unique identifier of the status bar item. The identifier
		 * is for example used to allow a user to show or hide the
		 * status bar item in the UI.
		 */
		id: string;

		/**
		 * A human readable name of the status bar item. The name is
		 * for example used as a label in the UI to show or hide the
		 * status bar item.
		 */
		name: string;

		/**
		 * Accessibility information used when screen reader interacts with this status bar item.
		 */
		accessibilityInformation?: AccessibilityInformation;

		/**
		 * The alignment of the status bar item.
		 */
		alignment?: StatusBarAlignment;

		/**
		 * The priority of the status bar item. Higher value means the item should
		 * be shown more to the left.
		 */
		priority?: number;
	}

	export namespace window {

		/**
		 * Creates a status bar [item](#StatusBarItem).
		 *
		 * @param options The options of the item. If not provided, some default values
		 * will be assumed. For example, the `StatusBarItemOptions.id` will be the id
		 * of the extension and the `StatusBarItemOptions.name` will be the extension name.
		 * @return A new status bar item.
		 */
		export function createStatusBarItem(options?: StatusBarItemOptions): StatusBarItem;
	}

	//#endregion

	//#region Custom editor move https://github.com/microsoft/vscode/issues/86146

	// TODO: Also for custom editor

	export interface CustomTextEditorProvider {

		/**
		 * Handle when the underlying resource for a custom editor is renamed.
		 *
		 * This allows the webview for the editor be preserved throughout the rename. If this method is not implemented,
		 * VS Code will destory the previous custom editor and create a replacement one.
		 *
		 * @param newDocument New text document to use for the custom editor.
		 * @param existingWebviewPanel Webview panel for the custom editor.
		 * @param token A cancellation token that indicates the result is no longer needed.
		 *
		 * @return Thenable indicating that the webview editor has been moved.
		 */
		// eslint-disable-next-line vscode-dts-provider-naming
		moveCustomTextEditor?(newDocument: TextDocument, existingWebviewPanel: WebviewPanel, token: CancellationToken): Thenable<void>;
	}

	//#endregion

	//#region allow QuickPicks to skip sorting: https://github.com/microsoft/vscode/issues/73904

	export interface QuickPick<T extends QuickPickItem> extends QuickInput {
		/**
		 * An optional flag to sort the final results by index of first query match in label. Defaults to true.
		 */
		sortByLabel: boolean;
	}

	//#endregion

	//#region allow title property to QuickPickOptions/InputBoxOptions: https://github.com/microsoft/vscode/issues/77423

	interface QuickPickOptions {
		/**
		 * An optional string that represents the tile of the quick pick.
		 */
		title?: string;
	}

	interface InputBoxOptions {
		/**
		 * An optional string that represents the tile of the input box.
		 */
		title?: string;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, Notebooks (misc)

	export enum NotebookCellKind {
		Markdown = 1,
		Code = 2
	}

	export class NotebookCellMetadata {
		/**
		 * Controls whether a cell's editor is editable/readonly.
		 */
		readonly editable?: boolean;
		/**
		 * Controls if the cell has a margin to support the breakpoint UI.
		 * This metadata is ignored for markdown cell.
		 */
		readonly breakpointMargin?: boolean;
		/**
		 * Whether a code cell's editor is collapsed
		 */
		readonly outputCollapsed?: boolean;
		/**
		 * Whether a code cell's outputs are collapsed
		 */
		readonly inputCollapsed?: boolean;
		/**
		 * Additional attributes of a cell metadata.
		 */
		readonly custom?: Record<string, any>;

		// todo@API duplicates status bar API
		readonly statusMessage?: string;

		// run related API, will be removed
		readonly hasExecutionOrder?: boolean;

		constructor(editable?: boolean, breakpointMargin?: boolean, hasExecutionOrder?: boolean, statusMessage?: string, lastRunDuration?: number, inputCollapsed?: boolean, outputCollapsed?: boolean, custom?: Record<string, any>)

		with(change: { editable?: boolean | null, breakpointMargin?: boolean | null, hasExecutionOrder?: boolean | null, statusMessage?: string | null, lastRunDuration?: number | null, inputCollapsed?: boolean | null, outputCollapsed?: boolean | null, custom?: Record<string, any> | null, }): NotebookCellMetadata;
	}

	export interface NotebookCellExecutionSummary {
		executionOrder?: number;
		success?: boolean;
		duration?: number;
	}

	// todo@API support ids https://github.com/jupyter/enhancement-proposals/blob/master/62-cell-id/cell-id.md
	export interface NotebookCell {
		readonly index: number;
		readonly notebook: NotebookDocument;
		readonly kind: NotebookCellKind;
		readonly document: TextDocument;
		readonly metadata: NotebookCellMetadata
		readonly outputs: ReadonlyArray<NotebookCellOutput>;
		readonly latestExecutionSummary: NotebookCellExecutionSummary | undefined;
	}

	export class NotebookDocumentMetadata {

		/**
		 * Controls if users can add or delete cells
		 * Defaults to true
		 */
		readonly editable: boolean;
		/**
		 * Default value for [cell editable metadata](#NotebookCellMetadata.editable).
		 * Defaults to true.
		 */
		readonly cellEditable: boolean;
		/**
		 * Additional attributes of the document metadata.
		 */
		readonly custom: { [key: string]: any; };
		/**
		 * Whether the document is trusted, default to true
		 * When false, insecure outputs like HTML, JavaScript, SVG will not be rendered.
		 */
		readonly trusted: boolean;

		// todo@API is this a kernel property?
		readonly cellHasExecutionOrder: boolean;

		constructor(editable?: boolean, cellEditable?: boolean, cellHasExecutionOrder?: boolean, custom?: { [key: string]: any; }, trusted?: boolean);

		with(change: { editable?: boolean | null, cellEditable?: boolean | null, cellHasExecutionOrder?: boolean | null, custom?: { [key: string]: any; } | null, trusted?: boolean | null, }): NotebookDocumentMetadata
	}

	export interface NotebookDocumentContentOptions {
		/**
		 * Controls if outputs change will trigger notebook document content change and if it will be used in the diff editor
		 * Default to false. If the content provider doesn't persisit the outputs in the file document, this should be set to true.
		 */
		transientOutputs: boolean;

		/**
		 * Controls if a meetadata property change will trigger notebook document content change and if it will be used in the diff editor
		 * Default to false. If the content provider doesn't persisit a metadata property in the file document, it should be set to true.
		 */
		transientMetadata: { [K in keyof NotebookCellMetadata]?: boolean };
	}

	export interface NotebookDocument {
		readonly uri: Uri;
		readonly version: number;

		/** @deprecated Use `uri` instead */
		// todo@API don't have this...
		readonly fileName: string;

		readonly isDirty: boolean;
		readonly isUntitled: boolean;

		/**
		 * `true` if the notebook has been closed. A closed notebook isn't synchronized anymore
		 * and won't be re-used when the same resource is opened again.
		 */
		readonly isClosed: boolean;

		readonly metadata: NotebookDocumentMetadata;

		// todo@API should we really expose this?
		readonly viewType: string;

		// todo@API cellsAt(range)? getCell(index>)?
		/** @deprecated Use `getCells(<...>) instead */
		readonly cells: ReadonlyArray<NotebookCell>;

		/**
		 * The number of cells in the notebook document.
		 */
		readonly cellCount: number;

		/**
		 * Return the cell at the specified index. The index will be adjusted to the notebook.
		 *
		 * @param index - The index of the cell to retrieve.
		 * @return A [cell](#NotebookCell).
		 */
		cellAt(index: number): NotebookCell;

		/**
		 * Get the cells of this notebook. A subset can be retrieved by providing
		 * a range. The range will be adjuset to the notebook.
		 *
		 * @param range A notebook range.
		 * @returns The cells contained by the range or all cells.
		 */
		getCells(range?: NotebookCellRange): ReadonlyArray<NotebookCell>;

		/**
		 * Save the document. The saving will be handled by the corresponding content provider
		 *
		 * @return A promise that will resolve to true when the document
		 * has been saved. If the file was not dirty or the save failed,
		 * will return false.
		 */
		save(): Thenable<boolean>;
	}

	// todo@API RENAME to NotebookRange
	// todo@API maybe have a NotebookCellPosition sibling
	export class NotebookCellRange {
		readonly start: number;
		/**
		 * exclusive
		 */
		readonly end: number;

		readonly isEmpty: boolean;

		constructor(start: number, end: number);

		with(change: { start?: number, end?: number }): NotebookCellRange;
	}

	export enum NotebookEditorRevealType {
		/**
		 * The range will be revealed with as little scrolling as possible.
		 */
		Default = 0,
		/**
		 * The range will always be revealed in the center of the viewport.
		 */
		InCenter = 1,

		/**
		 * If the range is outside the viewport, it will be revealed in the center of the viewport.
		 * Otherwise, it will be revealed with as little scrolling as possible.
		 */
		InCenterIfOutsideViewport = 2,

		/**
		 * The range will always be revealed at the top of the viewport.
		 */
		AtTop = 3
	}

	export interface NotebookEditor {
		/**
		 * The document associated with this notebook editor.
		 */
		readonly document: NotebookDocument;

		/**
		 * @deprecated
		 */
		// todo@API should not be undefined, rather a default
		readonly selection?: NotebookCell;

		/**
		 * todo@API should replace selection
		 * The selections on this notebook editor.
		 *
		 * The primary selection (or focused range) is `selections[0]`. When the document has no cells, the primary selection is empty `{ start: 0, end: 0 }`;
		 */
		readonly selections: NotebookCellRange[];

		/**
		 * The current visible ranges in the editor (vertically).
		 */
		readonly visibleRanges: NotebookCellRange[];

		revealRange(range: NotebookCellRange, revealType?: NotebookEditorRevealType): void;

		/**
		 * The column in which this editor shows.
		 */
		// @jrieken
		// this is not implemented...
		readonly viewColumn?: ViewColumn;

		/**
		 * @deprecated
		 */
		// @rebornix REMOVE/REplace NotebookCommunication
		// todo@API fishy? notebooks are public objects, there should be a "global" events for this
		readonly onDidDispose: Event<void>;
	}

	export interface NotebookDocumentMetadataChangeEvent {
		readonly document: NotebookDocument;
	}

	export interface NotebookCellsChangeData {
		readonly start: number;
		readonly deletedCount: number;
		readonly deletedItems: NotebookCell[];
		readonly items: NotebookCell[];
	}

	export interface NotebookCellsChangeEvent {

		/**
		 * The affected document.
		 */
		readonly document: NotebookDocument;
		readonly changes: ReadonlyArray<NotebookCellsChangeData>;
	}

	export interface NotebookCellOutputsChangeEvent {

		/**
		 * The affected document.
		 */
		readonly document: NotebookDocument;
		readonly cells: NotebookCell[];
	}

	export interface NotebookCellLanguageChangeEvent {

		/**
		 * The affected document.
		 */
		readonly document: NotebookDocument;
		readonly cell: NotebookCell;
		readonly language: string;
	}

	export interface NotebookCellMetadataChangeEvent {
		readonly document: NotebookDocument;
		readonly cell: NotebookCell;
	}

	export interface NotebookEditorSelectionChangeEvent {
		readonly notebookEditor: NotebookEditor;
		readonly selections: ReadonlyArray<NotebookCellRange>
	}

	export interface NotebookEditorVisibleRangesChangeEvent {
		readonly notebookEditor: NotebookEditor;
		readonly visibleRanges: ReadonlyArray<NotebookCellRange>;
	}

	export interface NotebookCellExecutionStateChangeEvent {
		readonly document: NotebookDocument;
		readonly cell: NotebookCell;
		readonly executionState: NotebookCellExecutionState;
	}

	// todo@API support ids https://github.com/jupyter/enhancement-proposals/blob/master/62-cell-id/cell-id.md
	export class NotebookCellData {
		kind: NotebookCellKind;
		// todo@API better names: value? text?
		source: string;
		// todo@API how does language and MD relate?
		language: string;
		outputs?: NotebookCellOutput[];
		metadata?: NotebookCellMetadata;
		latestExecutionSummary?: NotebookCellExecutionSummary;
		constructor(kind: NotebookCellKind, source: string, language: string, outputs?: NotebookCellOutput[], metadata?: NotebookCellMetadata, latestExecutionSummary?: NotebookCellExecutionSummary);
	}

	export class NotebookData {
		cells: NotebookCellData[];
		metadata: NotebookDocumentMetadata;
		constructor(cells: NotebookCellData[], metadata?: NotebookDocumentMetadata);
	}

	/**
	 * Communication object passed to the {@link NotebookContentProvider} and
	 * {@link NotebookOutputRenderer} to communicate with the webview.
	 */
	export interface NotebookCommunication {
		/**
		 * ID of the editor this object communicates with. A single notebook
		 * document can have multiple attached webviews and editors, when the
		 * notebook is split for instance. The editor ID lets you differentiate
		 * between them.
		 */
		readonly editorId: string;

		/**
		 * Fired when the output hosting webview posts a message.
		 */
		readonly onDidReceiveMessage: Event<any>;
		/**
		 * Post a message to the output hosting webview.
		 *
		 * Messages are only delivered if the editor is live.
		 *
		 * @param message Body of the message. This must be a string or other json serializable object.
		 */
		postMessage(message: any): Thenable<boolean>;

		/**
		 * Convert a uri for the local file system to one that can be used inside outputs webview.
		 */
		asWebviewUri(localResource: Uri): Uri;

		// @rebornix
		// readonly onDidDispose: Event<void>;
	}

	// export function registerNotebookKernel(selector: string, kernel: NotebookKernel): Disposable;


	export interface NotebookDocumentShowOptions {
		viewColumn?: ViewColumn;
		preserveFocus?: boolean;
		preview?: boolean;
		selection?: NotebookCellRange;
	}

	export namespace notebook {

		export function openNotebookDocument(uri: Uri): Thenable<NotebookDocument>;

		export const onDidOpenNotebookDocument: Event<NotebookDocument>;
		export const onDidCloseNotebookDocument: Event<NotebookDocument>;

		export const onDidSaveNotebookDocument: Event<NotebookDocument>;

		/**
		 * All currently known notebook documents.
		 */
		export const notebookDocuments: ReadonlyArray<NotebookDocument>;
		export const onDidChangeNotebookDocumentMetadata: Event<NotebookDocumentMetadataChangeEvent>;
		export const onDidChangeNotebookCells: Event<NotebookCellsChangeEvent>;
		export const onDidChangeCellOutputs: Event<NotebookCellOutputsChangeEvent>;

		export const onDidChangeCellMetadata: Event<NotebookCellMetadataChangeEvent>;
	}

	export namespace window {
		export const visibleNotebookEditors: NotebookEditor[];
		export const onDidChangeVisibleNotebookEditors: Event<NotebookEditor[]>;
		export const activeNotebookEditor: NotebookEditor | undefined;
		export const onDidChangeActiveNotebookEditor: Event<NotebookEditor | undefined>;
		export const onDidChangeNotebookEditorSelection: Event<NotebookEditorSelectionChangeEvent>;
		export const onDidChangeNotebookEditorVisibleRanges: Event<NotebookEditorVisibleRangesChangeEvent>;

		export function showNotebookDocument(uri: Uri, options?: NotebookDocumentShowOptions): Thenable<NotebookEditor>;
		export function showNotebookDocument(document: NotebookDocument, options?: NotebookDocumentShowOptions): Thenable<NotebookEditor>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookCellOutput

	// code specific mime types
	// application/x.notebook.error-traceback
	// application/x.notebook.stdout
	// application/x.notebook.stderr
	// application/x.notebook.stream
	export class NotebookCellOutputItem {

		// todo@API
		// add factory functions for common mime types
		// static textplain(value:string): NotebookCellOutputItem;
		// static errortrace(value:any): NotebookCellOutputItem;

		readonly mime: string;
		readonly value: unknown;
		readonly metadata?: Record<string, any>;

		constructor(mime: string, value: unknown, metadata?: Record<string, any>);
	}

	// @jrieken
	// todo@API think about readonly...
	//TODO@API add execution count to cell output?
	export class NotebookCellOutput {
		readonly id: string;
		readonly outputs: NotebookCellOutputItem[];
		readonly metadata?: Record<string, any>;

		constructor(outputs: NotebookCellOutputItem[], metadata?: Record<string, any>);

		constructor(outputs: NotebookCellOutputItem[], id: string, metadata?: Record<string, any>);
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookEditorEdit

	export interface WorkspaceEdit {
		replaceNotebookMetadata(uri: Uri, value: NotebookDocumentMetadata): void;

		// todo@API use NotebookCellRange
		replaceNotebookCells(uri: Uri, start: number, end: number, cells: NotebookCellData[], metadata?: WorkspaceEditEntryMetadata): void;
		replaceNotebookCellMetadata(uri: Uri, index: number, cellMetadata: NotebookCellMetadata, metadata?: WorkspaceEditEntryMetadata): void;

		replaceNotebookCellOutput(uri: Uri, index: number, outputs: NotebookCellOutput[], metadata?: WorkspaceEditEntryMetadata): void;
		appendNotebookCellOutput(uri: Uri, index: number, outputs: NotebookCellOutput[], metadata?: WorkspaceEditEntryMetadata): void;

		// TODO@api
		// https://jupyter-protocol.readthedocs.io/en/latest/messaging.html#update-display-data
		replaceNotebookCellOutputItems(uri: Uri, index: number, outputId: string, items: NotebookCellOutputItem[], metadata?: WorkspaceEditEntryMetadata): void;
		appendNotebookCellOutputItems(uri: Uri, index: number, outputId: string, items: NotebookCellOutputItem[], metadata?: WorkspaceEditEntryMetadata): void;
	}

	export interface NotebookEditorEdit {
		replaceMetadata(value: NotebookDocumentMetadata): void;
		replaceCells(start: number, end: number, cells: NotebookCellData[]): void;
		replaceCellOutput(index: number, outputs: NotebookCellOutput[]): void;
		replaceCellMetadata(index: number, metadata: NotebookCellMetadata): void;
	}

	export interface NotebookEditor {
		/**
		 * Perform an edit on the notebook associated with this notebook editor.
		 *
		 * The given callback-function is invoked with an [edit-builder](#NotebookEditorEdit) which must
		 * be used to make edits. Note that the edit-builder is only valid while the
		 * callback executes.
		 *
		 * @param callback A function which can create edits using an [edit-builder](#NotebookEditorEdit).
		 * @return A promise that resolves with a value indicating if the edits could be applied.
		 */
		// @jrieken REMOVE maybe
		edit(callback: (editBuilder: NotebookEditorEdit) => void): Thenable<boolean>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookSerializer

	export interface NotebookSerializer {
		dataToNotebook(data: Uint8Array): NotebookData | Thenable<NotebookData>;
		notebookToData(data: NotebookData): Uint8Array | Thenable<Uint8Array>;
	}

	export namespace notebook {

		// TODO@api use NotebookDocumentFilter instead of just notebookType:string?
		// TODO@API options duplicates the more powerful variant on NotebookContentProvider
		export function registerNotebookSerializer(notebookType: string, provider: NotebookSerializer, options?: NotebookDocumentContentOptions): Disposable;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookContentProvider


	interface NotebookDocumentBackup {
		/**
		 * Unique identifier for the backup.
		 *
		 * This id is passed back to your extension in `openNotebook` when opening a notebook editor from a backup.
		 */
		readonly id: string;

		/**
		 * Delete the current backup.
		 *
		 * This is called by VS Code when it is clear the current backup is no longer needed, such as when a new backup
		 * is made or when the file is saved.
		 */
		delete(): void;
	}

	interface NotebookDocumentBackupContext {
		readonly destination: Uri;
	}

	interface NotebookDocumentOpenContext {
		readonly backupId?: string;
		readonly untitledDocumentData?: Uint8Array;
	}

	// todo@API use openNotebookDOCUMENT to align with openCustomDocument etc?
	// todo@API rename to NotebookDocumentContentProvider
	export interface NotebookContentProvider {

		readonly options?: NotebookDocumentContentOptions;
		readonly onDidChangeNotebookContentOptions?: Event<NotebookDocumentContentOptions>;

		/**
		 * Content providers should always use [file system providers](#FileSystemProvider) to
		 * resolve the raw content for `uri` as the resouce is not necessarily a file on disk.
		 */
		openNotebook(uri: Uri, openContext: NotebookDocumentOpenContext, token: CancellationToken): NotebookData | Thenable<NotebookData>;

		saveNotebook(document: NotebookDocument, token: CancellationToken): Thenable<void>;

		saveNotebookAs(targetResource: Uri, document: NotebookDocument, token: CancellationToken): Thenable<void>;

		backupNotebook(document: NotebookDocument, context: NotebookDocumentBackupContext, token: CancellationToken): Thenable<NotebookDocumentBackup>;
	}

	export namespace notebook {

		// TODO@api use NotebookDocumentFilter instead of just notebookType:string?
		// TODO@API options duplicates the more powerful variant on NotebookContentProvider
		export function registerNotebookContentProvider(notebookType: string, provider: NotebookContentProvider,
			options?: NotebookDocumentContentOptions & {
				/**
				 * Not ready for production or development use yet.
				 */
				viewOptions?: {
					displayName: string;
					filenamePattern: NotebookFilenamePattern[];
					exclusive?: boolean;
				};
			}
		): Disposable;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookKernel

	export interface NotebookKernel {

		// todo@API make this mandatory?
		readonly id?: string;

		label: string;
		description?: string;
		detail?: string;
		isPreferred?: boolean;

		// todo@API is this maybe an output property?
		preloads?: Uri[];

		/**
		 * languages supported by kernel
		 * - first is preferred
		 * - `undefined` means all languages available in the editor
		 */
		supportedLanguages?: string[];

		// todo@API kernel updating itself
		// fired when properties like the supported languages etc change
		// onDidChangeProperties?: Event<void>

		/**
		 * A kernel can optionally implement this which will be called when any "cancel" button is clicked in the document.
		 */
		interrupt?(document: NotebookDocument): void;

		/**
		 * Called when the user triggers execution of a cell by clicking the run button for a cell, multiple cells,
		 * or full notebook. The cell will be put into the Pending state when this method is called. If
		 * createNotebookCellExecutionTask has not been called by the time the promise returned by this method is
		 * resolved, the cell will be put back into the Idle state.
		 */
		executeCellsRequest(document: NotebookDocument, ranges: NotebookCellRange[]): Thenable<void>;
	}

	export interface NotebookCellExecuteStartContext {
		// TODO@roblou are we concerned about clock issues with this absolute time?
		/**
		 * The time that execution began, in milliseconds in the Unix epoch. Used to drive the clock
		 * that shows for how long a cell has been running. If not given, the clock won't be shown.
		 */
		startTime?: number;
	}

	export interface NotebookCellExecuteEndContext {
		/**
		 * If true, a green check is shown on the cell status bar.
		 * If false, a red X is shown.
		 */
		success?: boolean;

		/**
		 * The total execution time in milliseconds.
		 */
		duration?: number;
	}

	/**
	 * A NotebookCellExecutionTask is how the kernel modifies a notebook cell as it is executing. When
	 * [`createNotebookCellExecutionTask`](#notebook.createNotebookCellExecutionTask) is called, the cell
	 * enters the Pending state. When `start()` is called on the execution task, it enters the Executing state. When
	 * `end()` is called, it enters the Idle state. While in the Executing state, cell outputs can be
	 * modified with the methods on the run task.
	 *
	 * All outputs methods operate on this NotebookCellExecutionTask's cell by default. They optionally take
	 * a cellIndex parameter that allows them to modify the outputs of other cells. `appendOutputItems` and
	 * `replaceOutputItems` operate on the output with the given ID, which can be an output on any cell. They
	 * all resolve once the output edit has been applied.
	 */
	export interface NotebookCellExecutionTask {
		readonly document: NotebookDocument;
		readonly cell: NotebookCell;

		start(context?: NotebookCellExecuteStartContext): void;
		executionOrder: number | undefined;
		end(result?: NotebookCellExecuteEndContext): void;
		readonly token: CancellationToken;

		clearOutput(cellIndex?: number): Thenable<void>;
		appendOutput(out: NotebookCellOutput | NotebookCellOutput[], cellIndex?: number): Thenable<void>;
		replaceOutput(out: NotebookCellOutput | NotebookCellOutput[], cellIndex?: number): Thenable<void>;
		appendOutputItems(items: NotebookCellOutputItem | NotebookCellOutputItem[], outputId: string): Thenable<void>;
		replaceOutputItems(items: NotebookCellOutputItem | NotebookCellOutputItem[], outputId: string): Thenable<void>;
	}

	export enum NotebookCellExecutionState {
		Idle = 1,
		Pending = 2,
		Executing = 3,
	}

	export namespace notebook {
		/**
		 * Creates a [`NotebookCellExecutionTask`](#NotebookCellExecutionTask). Should only be called by a kernel. Returns undefined unless requested by the active kernel.
		 * @param uri The [uri](#Uri) of the notebook document.
		 * @param index The index of the cell.
		 * @param kernelId The id of the kernel requesting this run task. If this kernel is not the current active kernel, `undefined` is returned.
		 */
		export function createNotebookCellExecutionTask(uri: Uri, index: number, kernelId: string): NotebookCellExecutionTask | undefined;

		export const onDidChangeCellExecutionState: Event<NotebookCellExecutionStateChangeEvent>;
	}

	export type NotebookFilenamePattern = GlobPattern | { include: GlobPattern; exclude: GlobPattern; };

	// todo@API why not for NotebookContentProvider?
	export interface NotebookDocumentFilter {
		viewType?: string | string[];
		filenamePattern?: NotebookFilenamePattern;
	}

	// export interface NotebookFilter {
	// 	readonly viewType?: string;
	// 	readonly scheme?: string;
	// 	readonly pattern?: GlobPattern;
	// }

	// export type NotebookSelector = NotebookFilter | string | ReadonlyArray<NotebookFilter | string>;

	// todo@API very unclear, provider MUST not return alive object but only data object
	// todo@API unclear how the flow goes
	export interface NotebookKernelProvider<T extends NotebookKernel = NotebookKernel> {
		onDidChangeKernels?: Event<NotebookDocument | undefined>;
		provideKernels(document: NotebookDocument, token: CancellationToken): ProviderResult<T[]>;
		resolveKernel?(kernel: T, document: NotebookDocument, webview: NotebookCommunication, token: CancellationToken): ProviderResult<void>;
	}

	export interface NotebookEditor {
		/**
		 * Active kernel used in the editor
		 */
		// todo@API unsure about that
		// kernel, kernel selection, kernel provider
		readonly kernel?: NotebookKernel;
	}

	export namespace notebook {
		export const onDidChangeActiveNotebookKernel: Event<{ document: NotebookDocument, kernel: NotebookKernel | undefined; }>;

		export function registerNotebookKernelProvider(selector: NotebookDocumentFilter, provider: NotebookKernelProvider): Disposable;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookEditorDecorationType

	export interface NotebookEditor {
		setDecorations(decorationType: NotebookEditorDecorationType, range: NotebookCellRange): void;
	}

	export interface NotebookDecorationRenderOptions {
		backgroundColor?: string | ThemeColor;
		borderColor?: string | ThemeColor;
		top: ThemableDecorationAttachmentRenderOptions;
	}

	export interface NotebookEditorDecorationType {
		readonly key: string;
		dispose(): void;
	}

	export namespace notebook {
		export function createNotebookEditorDecorationType(options: NotebookDecorationRenderOptions): NotebookEditorDecorationType;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookCellStatusBarItem

	/**
	 * Represents the alignment of status bar items.
	 */
	export enum NotebookCellStatusBarAlignment {

		/**
		 * Aligned to the left side.
		 */
		Left = 1,

		/**
		 * Aligned to the right side.
		 */
		Right = 2
	}

	export interface NotebookCellStatusBarItem {
		readonly cell: NotebookCell;
		readonly alignment: NotebookCellStatusBarAlignment;
		readonly priority?: number;
		text: string;
		tooltip: string | undefined;
		command: string | Command | undefined;
		accessibilityInformation?: AccessibilityInformation;
		show(): void;
		hide(): void;
		dispose(): void;
	}

	export namespace notebook {
		/**
		 * Creates a notebook cell status bar [item](#NotebookCellStatusBarItem).
		 * It will be disposed automatically when the notebook document is closed or the cell is deleted.
		 *
		 * @param cell The cell on which this item should be shown.
		 * @param alignment The alignment of the item.
		 * @param priority The priority of the item. Higher values mean the item should be shown more to the left.
		 * @return A new status bar item.
		 */
		// @roblourens
		// todo@API this should be a provider, https://github.com/microsoft/vscode/issues/105809
		export function createCellStatusBarItem(cell: NotebookCell, alignment?: NotebookCellStatusBarAlignment, priority?: number): NotebookCellStatusBarItem;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/106744, NotebookConcatTextDocument

	export namespace notebook {
		/**
		 * Create a document that is the concatenation of all  notebook cells. By default all code-cells are included
		 * but a selector can be provided to narrow to down the set of cells.
		 *
		 * @param notebook
		 * @param selector
		 */
		// @jrieken REMOVE. p_never
		// todo@API really needed? we didn't find a user here
		export function createConcatTextDocument(notebook: NotebookDocument, selector?: DocumentSelector): NotebookConcatTextDocument;
	}

	export interface NotebookConcatTextDocument {
		uri: Uri;
		isClosed: boolean;
		dispose(): void;
		onDidChange: Event<void>;
		version: number;
		getText(): string;
		getText(range: Range): string;

		offsetAt(position: Position): number;
		positionAt(offset: number): Position;
		validateRange(range: Range): Range;
		validatePosition(position: Position): Position;

		locationAt(positionOrRange: Position | Range): Location;
		positionAt(location: Location): Position;
		contains(uri: Uri): boolean;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/39441

	export interface CompletionItem {
		/**
		 * Will be merged into CompletionItem#label
		 */
		label2?: CompletionItemLabel;
	}

	export interface CompletionItemLabel {
		/**
		 * The function or variable. Rendered leftmost.
		 */
		name: string;

		/**
		 * The parameters without the return type. Render after `name`.
		 */
		parameters?: string;

		/**
		 * The fully qualified name, like package name or file path. Rendered after `signature`.
		 */
		qualifier?: string;

		/**
		 * The return-type of a function or type of a property/variable. Rendered rightmost.
		 */
		type?: string;
	}

	//#endregion

	//#region @eamodio - timeline: https://github.com/microsoft/vscode/issues/84297

	export class TimelineItem {
		/**
		 * A timestamp (in milliseconds since 1 January 1970 00:00:00) for when the timeline item occurred.
		 */
		timestamp: number;

		/**
		 * A human-readable string describing the timeline item.
		 */
		label: string;

		/**
		 * Optional id for the timeline item. It must be unique across all the timeline items provided by this source.
		 *
		 * If not provided, an id is generated using the timeline item's timestamp.
		 */
		id?: string;

		/**
		 * The icon path or [ThemeIcon](#ThemeIcon) for the timeline item.
		 */
		iconPath?: Uri | { light: Uri; dark: Uri; } | ThemeIcon;

		/**
		 * A human readable string describing less prominent details of the timeline item.
		 */
		description?: string;

		/**
		 * The tooltip text when you hover over the timeline item.
		 */
		detail?: string;

		/**
		 * The [command](#Command) that should be executed when the timeline item is selected.
		 */
		command?: Command;

		/**
		 * Context value of the timeline item. This can be used to contribute specific actions to the item.
		 * For example, a timeline item is given a context value as `commit`. When contributing actions to `timeline/item/context`
		 * using `menus` extension point, you can specify context value for key `timelineItem` in `when` expression like `timelineItem == commit`.
		 * ```
		 *	"contributes": {
		 *		"menus": {
		 *			"timeline/item/context": [
		 *				{
		 *					"command": "extension.copyCommitId",
		 *					"when": "timelineItem == commit"
		 *				}
		 *			]
		 *		}
		 *	}
		 * ```
		 * This will show the `extension.copyCommitId` action only for items where `contextValue` is `commit`.
		 */
		contextValue?: string;

		/**
		 * Accessibility information used when screen reader interacts with this timeline item.
		 */
		accessibilityInformation?: AccessibilityInformation;

		/**
		 * @param label A human-readable string describing the timeline item
		 * @param timestamp A timestamp (in milliseconds since 1 January 1970 00:00:00) for when the timeline item occurred
		 */
		constructor(label: string, timestamp: number);
	}

	export interface TimelineChangeEvent {
		/**
		 * The [uri](#Uri) of the resource for which the timeline changed.
		 */
		uri: Uri;

		/**
		 * A flag which indicates whether the entire timeline should be reset.
		 */
		reset?: boolean;
	}

	export interface Timeline {
		readonly paging?: {
			/**
			 * A provider-defined cursor specifying the starting point of timeline items which are after the ones returned.
			 * Use `undefined` to signal that there are no more items to be returned.
			 */
			readonly cursor: string | undefined;
		};

		/**
		 * An array of [timeline items](#TimelineItem).
		 */
		readonly items: readonly TimelineItem[];
	}

	export interface TimelineOptions {
		/**
		 * A provider-defined cursor specifying the starting point of the timeline items that should be returned.
		 */
		cursor?: string;

		/**
		 * An optional maximum number timeline items or the all timeline items newer (inclusive) than the timestamp or id that should be returned.
		 * If `undefined` all timeline items should be returned.
		 */
		limit?: number | { timestamp: number; id?: string; };
	}

	export interface TimelineProvider {
		/**
		 * An optional event to signal that the timeline for a source has changed.
		 * To signal that the timeline for all resources (uris) has changed, do not pass any argument or pass `undefined`.
		 */
		onDidChange?: Event<TimelineChangeEvent | undefined>;

		/**
		 * An identifier of the source of the timeline items. This can be used to filter sources.
		 */
		readonly id: string;

		/**
		 * A human-readable string describing the source of the timeline items. This can be used as the display label when filtering sources.
		 */
		readonly label: string;

		/**
		 * Provide [timeline items](#TimelineItem) for a [Uri](#Uri).
		 *
		 * @param uri The [uri](#Uri) of the file to provide the timeline for.
		 * @param options A set of options to determine how results should be returned.
		 * @param token A cancellation token.
		 * @return The [timeline result](#TimelineResult) or a thenable that resolves to such. The lack of a result
		 * can be signaled by returning `undefined`, `null`, or an empty array.
		 */
		provideTimeline(uri: Uri, options: TimelineOptions, token: CancellationToken): ProviderResult<Timeline>;
	}

	export namespace workspace {
		/**
		 * Register a timeline provider.
		 *
		 * Multiple providers can be registered. In that case, providers are asked in
		 * parallel and the results are merged. A failing provider (rejected promise or exception) will
		 * not cause a failure of the whole operation.
		 *
		 * @param scheme A scheme or schemes that defines which documents this provider is applicable to. Can be `*` to target all documents.
		 * @param provider A timeline provider.
		 * @return A [disposable](#Disposable) that unregisters this provider when being disposed.
		*/
		export function registerTimelineProvider(scheme: string | string[], provider: TimelineProvider): Disposable;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/91555

	export enum StandardTokenType {
		Other = 0,
		Comment = 1,
		String = 2,
		RegEx = 4
	}

	export interface TokenInformation {
		type: StandardTokenType;
		range: Range;
	}

	export namespace languages {
		export function getTokenInformationAtPosition(document: TextDocument, position: Position): Thenable<TokenInformation>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/16221

	// todo@API rename to InlayHint
	// todo@API add "mini-markdown" for links and styles
	// todo@API remove description
	// (done:)  add InlayHintKind with type, argument, etc

	export namespace languages {
		/**
		 * Register a inline hints provider.
		 *
		 * Multiple providers can be registered for a language. In that case providers are asked in
		 * parallel and the results are merged. A failing provider (rejected promise or exception) will
		 * not cause a failure of the whole operation.
		 *
		 * @param selector A selector that defines the documents this provider is applicable to.
		 * @param provider An inline hints provider.
		 * @return A [disposable](#Disposable) that unregisters this provider when being disposed.
		 */
		export function registerInlineHintsProvider(selector: DocumentSelector, provider: InlineHintsProvider): Disposable;
	}

	export enum InlineHintKind {
		Other = 0,
		Type = 1,
		Parameter = 2,
	}

	/**
	 * Inline hint information.
	 */
	export class InlineHint {
		/**
		 * The text of the hint.
		 */
		text: string;
		/**
		 * The range of the hint.
		 */
		range: Range;

		kind?: InlineHintKind;

		// todo@API remove this
		description?: string | MarkdownString;
		/**
		 * Whitespace before the hint.
		 */
		whitespaceBefore?: boolean;
		/**
		 * Whitespace after the hint.
		 */
		whitespaceAfter?: boolean;

		// todo@API make range first argument
		constructor(text: string, range: Range, kind?: InlineHintKind);
	}

	/**
	 * The inline hints provider interface defines the contract between extensions and
	 * the inline hints feature.
	 */
	export interface InlineHintsProvider {

		/**
		 * An optional event to signal that inline hints have changed.
		 * @see [EventEmitter](#EventEmitter)
		 */
		onDidChangeInlineHints?: Event<void>;

		/**
		 * @param model The document in which the command was invoked.
		 * @param range The range for which line hints should be computed.
		 * @param token A cancellation token.
		 *
		 * @return A list of arguments labels or a thenable that resolves to such.
		 */
		provideInlineHints(model: TextDocument, range: Range, token: CancellationToken): ProviderResult<InlineHint[]>;
	}
	//#endregion

	//#region https://github.com/microsoft/vscode/issues/104436

	export enum ExtensionRuntime {
		/**
		 * The extension is running in a NodeJS extension host. Runtime access to NodeJS APIs is available.
		 */
		Node = 1,
		/**
		 * The extension is running in a Webworker extension host. Runtime access is limited to Webworker APIs.
		 */
		Webworker = 2
	}

	export interface ExtensionContext {
		readonly extensionRuntime: ExtensionRuntime;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/102091

	export interface TextDocument {

		/**
		 * The [notebook](#NotebookDocument) that contains this document as a notebook cell or `undefined` when
		 * the document is not contained by a notebook (this should be the more frequent case).
		 */
		notebook: NotebookDocument | undefined;
	}
	//#endregion

	//#region https://github.com/microsoft/vscode/issues/107467
	/*
		General activation events:
			- `onLanguage:*` most test extensions will want to activate when their
				language is opened to provide code lenses.
			- `onTests:*` new activation event very simiular to `workspaceContains`,
				but only fired when the user wants to run tests or opens the test explorer.
	*/
	export namespace test {
		/**
		 * Registers a provider that discovers tests in workspaces and documents.
		 */
		export function registerTestProvider<T extends TestItem>(testProvider: TestProvider<T>): Disposable;

		/**
		 * Runs tests. The "run" contains the list of tests to run as well as a
		 * method that can be used to update their state. At the point in time
		 * that "run" is called, all tests given in the run have their state
		 * automatically set to {@link TestRunState.Queued}.
		 */
		export function runTests<T extends TestItem>(run: TestRunRequest<T>, token?: CancellationToken): Thenable<void>;

		/**
		 * Returns an observer that retrieves tests in the given workspace folder.
		 */
		export function createWorkspaceTestObserver(workspaceFolder: WorkspaceFolder): TestObserver;

		/**
		 * Returns an observer that retrieves tests in the given text document.
		 */
		export function createDocumentTestObserver(document: TextDocument): TestObserver;

		/**
		 * Inserts custom test results into the VS Code UI. The results are
		 * inserted and sorted based off the `completedAt` timestamp. If the
		 * results are being read from a file, for example, the `completedAt`
		 * time should generally be the modified time of the file if not more
		 * specific time is available.
		 *
		 * This will no-op if the inserted results are deeply equal to an
		 * existing result.
		 *
		 * @param results test results
		 * @param persist whether the test results should be saved by VS Code
		 * and persisted across reloads. Defaults to true.
		 */
		export function publishTestResult(results: TestRunResult, persist?: boolean): void;

		/**
		* List of test results stored by VS Code, sorted in descnding
		* order by their `completedAt` time.
		*/
		export const testResults: ReadonlyArray<TestRunResult>;

		/**
		* Event that fires when the {@link testResults} array is updated.
		*/
		export const onDidChangeTestResults: Event<void>;
	}

	export interface TestObserver {
		/**
		 * List of tests returned by test provider for files in the workspace.
		 */
		readonly tests: ReadonlyArray<TestItem>;

		/**
		 * An event that fires when an existing test in the collection changes, or
		 * null if a top-level test was added or removed. When fired, the consumer
		 * should check the test item and all its children for changes.
		 */
		readonly onDidChangeTest: Event<TestsChangeEvent>;

		/**
		 * An event that fires when all test providers have signalled that the tests
		 * the observer references have been discovered. Providers may continue to
		 * watch for changes and cause {@link onDidChangeTest} to fire as files
		 * change, until the observer is disposed.
		 *
		 * @todo as below
		 */
		readonly onDidDiscoverInitialTests: Event<void>;

		/**
		 * Dispose of the observer, allowing VS Code to eventually tell test
		 * providers that they no longer need to update tests.
		 */
		dispose(): void;
	}

	export interface TestsChangeEvent {
		/**
		 * List of all tests that are newly added.
		 */
		readonly added: ReadonlyArray<TestItem>;

		/**
		 * List of existing tests that have updated.
		 */
		readonly updated: ReadonlyArray<TestItem>;

		/**
		 * List of existing tests that have been removed.
		 */
		readonly removed: ReadonlyArray<TestItem>;
	}

	/**
	 * Discovers and provides tests.
	 *
	 * Additionally, the UI may request it to discover tests for the workspace
	 * via `addWorkspaceTests`.
	 *
	 * @todo rename from provider
	 */
	export interface TestProvider<T extends TestItem = TestItem> {
		/**
		 * Requests that tests be provided for the given workspace. This will
		 * be called when tests need to be enumerated for the workspace, such as
		 * when the user opens the test explorer.
		 *
		 * It's guaranteed that this method will not be called again while
		 * there is a previous uncancelled call for the given workspace folder.
		 *
		 * @param workspace The workspace in which to observe tests
		 * @param cancellationToken Token that signals the used asked to abort the test run.
		 * @returns the root test item for the workspace
		 */
		provideWorkspaceTestRoot(workspace: WorkspaceFolder, token: CancellationToken): ProviderResult<T>;

		/**
		 * Requests that tests be provided for the given document. This will be
		 * called when tests need to be enumerated for a single open file, for
		 * instance by code lens UI.
		 *
		 * It's suggested that the provider listen to change events for the text
		 * document to provide information for test that might not yet be
		 * saved, if possible.
		 *
		 * If the test system is not able to provide or estimate for tests on a
		 * per-file basis, this method may not be implemented. In that case, the
		 * editor will request and use the information from the workspace tree.
		 *
		 * @param document The document in which to observe tests
		 * @param cancellationToken Token that signals the used asked to abort the test run.
		 * @returns the root test item for the workspace
		 */
		provideDocumentTestRoot?(document: TextDocument, token: CancellationToken): ProviderResult<T>;

		/**
		 * @todo this will move out of the provider soon
		 * @todo this will eventually need to be able to return a summary report, coverage for example.
		 *
		 * Starts a test run. This should cause {@link onDidChangeTest} to
		 * fire with update test states during the run.
		 * @param options Options for this test run
		 * @param cancellationToken Token that signals the used asked to abort the test run.
		 */
		// eslint-disable-next-line vscode-dts-provider-naming
		runTests(options: TestRunOptions<T>, token: CancellationToken): ProviderResult<void>;
	}

	/**
	 * Options given to {@link test.runTests}.
	 */
	export interface TestRunRequest<T extends TestItem = TestItem> {
		/**
		 * Array of specific tests to run. The {@link TestProvider.testRoot} may
		 * be provided as an indication to run all tests.
		 */
		tests: T[];

		/**
		 * An array of tests the user has marked as excluded in VS Code. May be
		 * omitted if no exclusions were requested. Test providers should not run
		 * excluded tests or any children of excluded tests.
		 */
		exclude?: T[];

		/**
		 * Whether or not tests in this run should be debugged.
		 */
		debug: boolean;
	}

	/**
	 * Options given to {@link TestProvider.runTests}
	 */
	export interface TestRunOptions<T extends TestItem = TestItem> extends TestRunRequest<T> {
		/**
		 * Updates the state of the test in the run. By default, all tests involved
		 * in the run will have a "queued" state until they are updated by this method.
		 *
		 * Calling with method with nodes outside the {@link TestRunRequesttests}
		 * or in the {@link TestRunRequestexclude} array will no-op.
		 *
		 * @param test The test to update
		 * @param state The state to assign to the test
		 * @param duration Optionally sets how long the test took to run
		 */
		setState(test: T, state: TestResultState, duration?: number): void;

		/**
		 * Appends a message, such as an assertion error, to the test item.
		 *
		 * Calling with method with nodes outside the {@link TestRunRequesttests}
		 * or in the {@link TestRunRequestexclude} array will no-op.
		 *
		 * @param test The test to update
		 * @param state The state to assign to the test
		 *
		 */
		appendMessage(test: T, message: TestMessage): void;

		/**
		 * Appends raw output from the test runner. On the user's request, the
		 * output will be displayed in a terminal. ANSI escape sequences,
		 * such as colors and text styles, are supported.
		 */
		appendOutput(output: string): void;
	}

	export interface TestChildrenCollection<T> extends Iterable<T> {
		/**
		 * Gets the number of children in the collection.
		 */
		readonly size: number;

		/**
		 * Gets an existing TestItem by its ID, if it exists.
		 * @param id ID of the test.
		 * @returns the TestItem instance if it exists.
		 */
		get(id: string): T | undefined;

		/**
		 * Adds a new child test item. No-ops if the test was already a child.
		 * @param child The test item to add.
		 */
		add(child: T): void;

		/**
		 * Removes the child test item by reference or ID from the collection.
		 * @param child Child ID or instance to remove.
		 */
		delete(child: T | string): void;

		/**
		 * Removes all children from the collection.
		 */
		clear(): void;
	}

	/**
	 * A test item is an item shown in the "test explorer" view. It encompasses
	 * both a suite and a test, since they have almost or identical capabilities.
	 */
	export class TestItem<TChildren = any> {
		/**
		 * Unique identifier for the TestItem. This is used to correlate
		 * test results and tests in the document with those in the workspace
		 * (test explorer). This must not change for the lifetime of the TestItem.
		 */
		readonly id: string;

		/**
		 * URI this TestItem is associated with. May be a file or directory.
		 */
		readonly uri: Uri;

		/**
		 * A set of children this item has. You can add new children to it, which
		 * will propagate to the editor UI.
		 */
		readonly children: TestChildrenCollection<TChildren>;

		/**
		 * Display name describing the test case.
		 */
		label: string;

		/**
		 * Optional description that appears next to the label.
		 */
		description?: string;

		/**
		 * Location of the test item in its `uri`. This is only meaningful if the
		 * `uri` points to a file.
		 */
		range?: Range;

		/**
		 * Whether this test item can be run by providing it in the
		 * {@link TestRunRequest.tests} array. Defaults to `true`.
		 */
		runnable: boolean;

		/**
		 * Whether this test item can be debugged by providing it in the
		 * {@link TestRunRequest.tests} array. Defaults to `false`.
		 */
		debuggable: boolean;

		/**
		 * Whether this test item can be expanded in the tree view, implying it
		 * has (or may have) children. If this is true, VS Code may call
		 * the {@link TestItem.discoverChildren} method.
		 */
		expandable: boolean;

		/**
		 * Creates a new TestItem instance.
		 * @param id Value of the "id" property
		 * @param label Value of the "label" property.
		 * @param uri Value of the "uri" property.
		 * @param expandable Value of the "expandable" property.
		 */
		constructor(id: string, label: string, uri: Uri, expandable: boolean);

		/**
		 * Marks the test as outdated. This can happen as a result of file changes,
		 * for example. In "auto run" mode, tests that are outdated will be
		 * automatically rerun after a short delay. Invoking this on a
		 * test with children will mark the entire subtree as outdated.
		 *
		 * Extensions should generally not override this method.
		 */
		invalidate(): void;

		/**
		 * Requests the children of the test item. Extensions should override this
		 * method for any test that can discover children.
		 *
		 * When called, the item should discover tests and update its's `children`.
		 * The provider will be marked as 'busy' when this method is called, and
		 * the provider should report `{ busy: false }` to {@link Progress.report}
		 * once discovery is complete.
		 *
		 * The item should continue watching for changes to the children and
		 * firing updates until the token is cancelled. The process of watching
		 * the tests may involve creating a file watcher, for example.
		 *
		 * The editor will only call this method when it's interested in refreshing
		 * the children of the item, and will not call it again while there's an
		 * existing, uncancelled discovery for an item.
		 *
		 * @param token Cancellation for the request. Cancellation will be
		 * requested if the test changes before the previous call completes.
		 * @returns a provider result of child test items
		 */
		discoverChildren(progress: Progress<{ busy: boolean }>, token: CancellationToken): void;
	}

	/**
	 * Possible states of tests in a test run.
	 */
	export enum TestResultState {
		// Initial state
		Unset = 0,
		// Test will be run, but is not currently running.
		Queued = 1,
		// Test is currently running
		Running = 2,
		// Test run has passed
		Passed = 3,
		// Test run has failed (on an assertion)
		Failed = 4,
		// Test run has been skipped
		Skipped = 5,
		// Test run failed for some other reason (compilation error, timeout, etc)
		Errored = 6
	}

	/**
	 * Represents the severity of test messages.
	 */
	export enum TestMessageSeverity {
		Error = 0,
		Warning = 1,
		Information = 2,
		Hint = 3
	}

	/**
	 * Message associated with the test state. Can be linked to a specific
	 * source range -- useful for assertion failures, for example.
	 */
	export class TestMessage {
		/**
		 * Human-readable message text to display.
		 */
		message: string | MarkdownString;

		/**
		 * Message severity. Defaults to "Error".
		 */
		severity: TestMessageSeverity;

		/**
		 * Expected test output. If given with `actualOutput`, a diff view will be shown.
		 */
		expectedOutput?: string;

		/**
		 * Actual test output. If given with `expectedOutput`, a diff view will be shown.
		 */
		actualOutput?: string;

		/**
		 * Associated file location.
		 */
		location?: Location;

		/**
		 * Creates a new TestMessage that will present as a diff in the editor.
		 * @param message Message to display to the user.
		 * @param expected Expected output.
		 * @param actual Actual output.
		 */
		static diff(message: string | MarkdownString, expected: string, actual: string): TestMessage;

		/**
		 * Creates a new TestMessage instance.
		 * @param message The message to show to the user.
		 */
		constructor(message: string | MarkdownString);
	}

	/**
	 * TestResults can be provided to VS Code in {@link test.publishTestResult},
	 * or read from it in {@link test.testResults}.
	 *
	 * The results contain a 'snapshot' of the tests at the point when the test
	 * run is complete. Therefore, information such as its {@link Range} may be
	 * out of date. If the test still exists in the workspace, consumers can use
	 * its `id` to correlate the result instance with the living test.
	 *
	 * @todo coverage and other info may eventually be provided here
	 */
	export interface TestRunResult {
		/**
		 * Unix milliseconds timestamp at which the test run was completed.
		 */
		completedAt: number;

		/**
		 * List of test results. The items in this array are the items that
		 * were passed in the {@link test.runTests} method.
		 */
		results: ReadonlyArray<Readonly<TestResultSnapshot>>;
	}

	/**
	 * A {@link TestItem}-like interface with an associated result, which appear
	 * or can be provided in {@link TestResult} interfaces.
	 */
	export interface TestResultSnapshot {
		/**
		 * Unique identifier that matches that of the associated TestItem.
		 * This is used to correlate test results and tests in the document with
		 * those in the workspace (test explorer).
		 */
		readonly id: string;

		/**
		 * URI this TestItem is associated with. May be a file or file.
		 */
		readonly uri: Uri;

		/**
		 * Display name describing the test case.
		 */
		readonly label: string;

		/**
		 * Optional description that appears next to the label.
		 */
		readonly description?: string;

		/**
		 * Location of the test item in its `uri`. This is only meaningful if the
		 * `uri` points to a file.
		 */
		readonly range?: Range;

		/**
		 * Current result of the test.
		 */
		readonly state: TestResultState;

		/**
		 * The number of milliseconds the test took to run. This is set once the
		 * `state` is `Passed`, `Failed`, or `Errored`.
		 */
		readonly duration?: number;

		/**
		 * Associated test run message. Can, for example, contain assertion
		 * failure information if the test fails.
		 */
		readonly messages: ReadonlyArray<TestMessage>;

		/**
		 * Optional list of nested tests for this item.
		 */
		readonly children: Readonly<TestResultSnapshot>[];
	}

	//#endregion

	//#region Opener service (https://github.com/microsoft/vscode/issues/109277)

	/**
	 * Details if an `ExternalUriOpener` can open a uri.
	 *
	 * The priority is also used to rank multiple openers against each other and determine
	 * if an opener should be selected automatically or if the user should be prompted to
	 * select an opener.
	 *
	 * VS Code will try to use the best available opener, as sorted by `ExternalUriOpenerPriority`.
	 * If there are multiple potential "best" openers for a URI, then the user will be prompted
	 * to select an opener.
	 */
	export enum ExternalUriOpenerPriority {
		/**
		 * The opener is disabled and will never be shown to users.
		 *
		 * Note that the opener can still be used if the user specifically
		 * configures it in their settings.
		 */
		None = 0,

		/**
		 * The opener can open the uri but will not cause a prompt on its own
		 * since VS Code always contributes a built-in `Default` opener.
		 */
		Option = 1,

		/**
		 * The opener can open the uri.
		 *
		 * VS Code's built-in opener has `Default` priority. This means that any additional `Default`
		 * openers will cause the user to be prompted to select from a list of all potential openers.
		 */
		Default = 2,

		/**
		 * The opener can open the uri and should be automatically selected over any
		 * default openers, include the built-in one from VS Code.
		 *
		 * A preferred opener will be automatically selected if no other preferred openers
		 * are available. If multiple preferred openers are available, then the user
		 * is shown a prompt with all potential openers (not just preferred openers).
		 */
		Preferred = 3,
	}

	/**
	 * Handles opening uris to external resources, such as http(s) links.
	 *
	 * Extensions can implement an `ExternalUriOpener` to open `http` links to a webserver
	 * inside of VS Code instead of having the link be opened by the web browser.
	 *
	 * Currently openers may only be registered for `http` and `https` uris.
	 */
	export interface ExternalUriOpener {

		/**
		 * Check if the opener can open a uri.
		 *
		 * @param uri The uri being opened. This is the uri that the user clicked on. It has
		 * not yet gone through port forwarding.
		 * @param token Cancellation token indicating that the result is no longer needed.
		 *
		 * @return Priority indicating if the opener can open the external uri.
		 */
		canOpenExternalUri(uri: Uri, token: CancellationToken): ExternalUriOpenerPriority | Thenable<ExternalUriOpenerPriority>;

		/**
		 * Open a uri.
		 *
		 * This is invoked when:
		 *
		 * - The user clicks a link which does not have an assigned opener. In this case, first `canOpenExternalUri`
		 *   is called and if the user selects this opener, then `openExternalUri` is called.
		 * - The user sets the default opener for a link in their settings and then visits a link.
		 *
		 * @param resolvedUri The uri to open. This uri may have been transformed by port forwarding, so it
		 * may not match the original uri passed to `canOpenExternalUri`. Use `ctx.originalUri` to check the
		 * original uri.
		 * @param ctx Additional information about the uri being opened.
		 * @param token Cancellation token indicating that opening has been canceled.
		 *
		 * @return Thenable indicating that the opening has completed.
		 */
		openExternalUri(resolvedUri: Uri, ctx: OpenExternalUriContext, token: CancellationToken): Thenable<void> | void;
	}

	/**
	 * Additional information about the uri being opened.
	 */
	interface OpenExternalUriContext {
		/**
		 * The uri that triggered the open.
		 *
		 * This is the original uri that the user clicked on or that was passed to `openExternal.`
		 * Due to port forwarding, this may not match the `resolvedUri` passed to `openExternalUri`.
		 */
		readonly sourceUri: Uri;
	}

	/**
	 * Additional metadata about a registered `ExternalUriOpener`.
	 */
	interface ExternalUriOpenerMetadata {

		/**
		 * List of uri schemes the opener is triggered for.
		 *
		 * Currently only `http` and `https` are supported.
		 */
		readonly schemes: readonly string[]

		/**
		 * Text displayed to the user that explains what the opener does.
		 *
		 * For example, 'Open in browser preview'
		 */
		readonly label: string;
	}

	namespace window {
		/**
		 * Register a new `ExternalUriOpener`.
		 *
		 * When a uri is about to be opened, an `onOpenExternalUri:SCHEME` activation event is fired.
		 *
		 * @param id Unique id of the opener, such as `myExtension.browserPreview`. This is used in settings
		 *   and commands to identify the opener.
		 * @param opener Opener to register.
		 * @param metadata Additional information about the opener.
		 *
		* @returns Disposable that unregisters the opener.
		*/
		export function registerExternalUriOpener(id: string, opener: ExternalUriOpener, metadata: ExternalUriOpenerMetadata): Disposable;
	}

	interface OpenExternalOptions {
		/**
		 * Allows using openers contributed by extensions through  `registerExternalUriOpener`
		 * when opening the resource.
		 *
		 * If `true`, VS Code will check if any contributed openers can handle the
		 * uri, and fallback to the default opener behavior.
		 *
		 * If it is string, this specifies the id of the `ExternalUriOpener`
		 * that should be used if it is available. Use `'default'` to force VS Code's
		 * standard external opener to be used.
		 */
		readonly allowContributedOpeners?: boolean | string;
	}

	namespace env {
		export function openExternal(target: Uri, options?: OpenExternalOptions): Thenable<boolean>;
	}

	//#endregion

	//#region https://github.com/Microsoft/vscode/issues/15178

	// TODO@API must be a class
	export interface OpenEditorInfo {
		name: string;
		resource: Uri;
	}

	export namespace window {
		export const openEditors: ReadonlyArray<OpenEditorInfo>;

		// todo@API proper event type
		export const onDidChangeOpenEditors: Event<void>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/120173

	export enum WorkspaceTrustState {
		/**
		 * The workspace is untrusted, and it will have limited functionality.
		 */
		Untrusted = 0,

		/**
		 * The workspace is trusted, and all functionality will be available.
		 */
		Trusted = 1,

		/**
		 * The initial state of the workspace.
		 *
		 * If trust will be required, users will be prompted to make a choice.
		 */
		Unspecified = 2
	}

	/**
	 * The event data that is fired when the trust state of the workspace changes.
	 * When trust is revoked, the workspace will be reloaded. Therefore, extensions are
	 * not expected to handle transitions out of a trusted state.
	 */
	export interface WorkspaceTrustStateChangeEvent {
		/**
		 * New trust state of the workspace
		 */
		readonly newTrustState: WorkspaceTrustState;
	}

	/**
	 * The object describing the properties of the workspace trust request
	 */
	export interface WorkspaceTrustRequestOptions {
		/**
		 * When true, a modal dialog will be used to request workspace trust.
		 * When false, a badge will be displayed on the Setting activity bar item
		 */
		readonly modal: boolean;
	}

	export namespace workspace {
		/**
		 * The trust state of the current workspace
		 */
		export const trustState: WorkspaceTrustState;

		/**
		 * Prompt the user to chose whether to trust the current workspace
		 * @param options Optional object describing the properties of the
		 * workspace trust request
		 */
		export function requestWorkspaceTrust(options?: WorkspaceTrustRequestOptions): Thenable<WorkspaceTrustState | undefined>;

		/**
		 * Event that fires when the trust state of the current workspace changes
		 */
		export const onDidChangeWorkspaceTrustState: Event<WorkspaceTrustStateChangeEvent>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/115807

	export interface Webview {
		/**
		 * @param message A json serializable message to send to the webview.
		 *
		 *   For older versions of vscode, if an `ArrayBuffer` is included in `message`,
		 *   it will not be serialized properly and will not be received by the webview.
		 *   Similarly any TypedArrays, such as a `Uint8Array`, will be very inefficiently
		 *   serialized and will also not be recreated as a typed array inside the webview.
		 *
		 *   However if your extension targets vscode 1.56+ in the `engines` field of its
		 *   `package.json` any `ArrayBuffer` values that appear in `message` will be more
		 *   efficiently transferred to the webview and will also be recreated inside of
		 *   the webview.
		 */
		postMessage(message: any): Thenable<boolean>;
	}

	//#endregion

	//#region https://github.com/microsoft/vscode/issues/115616 @alexr00
	export enum PortAutoForwardAction {
		Notify = 1,
		OpenBrowser = 2,
		OpenPreview = 3,
		Silent = 4,
		Ignore = 5
	}

	export interface PortAttributes {
		port: number;
		autoForwardAction: PortAutoForwardAction
	}

	export interface PortAttributesProvider {
		/**
		 * Provides attributes for the given ports. For ports that your extension doesn't know about, simply don't include
		 * them in the returned array. For example, if `providePortAttributes` is called with ports [3000, 4000] but your
		 * extension doesn't know anything about those ports you can return an empty array.
		 */
		providePortAttributes(ports: number[], pid: number | undefined, commandLine: string | undefined, token: CancellationToken): ProviderResult<PortAttributes[]>;
	}

	export namespace workspace {
		/**
		 * If your extension listens on ports, consider registering a PortAttributesProvider to provide information
		 * about the ports. For example, a debug extension may know about debug ports in it's debuggee. By providing
		 * this information with a PortAttributesProvider the extension can tell VS Code that these ports should be
		 * ignored, since they don't need to be user facing.
		 *
		 * @param portSelector If registerPortAttributesProvider is called after you start your process then you may already
		 * know the range of ports or the pid of your process.
		 * The `portRange` is start inclusive and end exclusive.
		 * @param provider The PortAttributesProvider
		 */
		export function registerPortAttributesProvider(portSelector: { pid?: number, portRange?: [number, number] }, provider: PortAttributesProvider): Disposable;
	}
	//#endregion
}
