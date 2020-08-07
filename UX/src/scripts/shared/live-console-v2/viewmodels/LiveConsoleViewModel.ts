import { OptionValues } from '@appinsights/react-select';
import { CellMeasurerCache } from 'react-virtualized';

import { BaseViewModel } from '../../BaseViewModel';
import { RefreshService } from '../../RefreshService';

import { ILogItem, LogBufferManager } from '../../Utilities/LogBufferManager';

import { DropDownOption } from '../../pill-component/TextDropDownPill';

import { ILiveConsoleRefreshViewParentContext } from '../views/LiveConsoleView';
import { LiveConsoleModel, IQueryParameters } from '../models/LiveConsoleModel';
import { ITelemetry } from '../../Telemetry';

// TODO: remove me!
import { MainPaneBindables } from '../../../container/deployments/DeploymentBindables';
import { polyfillArrayFrom } from '../../ArrayFromShim';

export interface ILiveMetaData {
    getTitle(): string;
    getSubTitle(): string;
}


export interface ILiveDataService {
    queryData(data?: any): Promise<ILogItem[]>;

    getMetaData(data?: any): ILiveMetaData;
}

export class LiveConsoleViewModel extends BaseViewModel {
    private _dataSerivce: ILiveDataService = null;

    private _model: LiveConsoleModel = null;

    constructor(
        private telemetry: ITelemetry,
        forceUpdate: reactForceUpdateHandler,
        parentContext: ILiveConsoleRefreshViewParentContext
    ) {
        super(forceUpdate, parentContext);

        console.log('LiveConsoleViewModel::CTOR!!!1');

        this._onNumMatchesChanged = this._onNumMatchesChanged.bind(this);
        this.hideLiveConsole = this.hideLiveConsole.bind(this);
        this.onParentPropertyChanged = this.onParentPropertyChanged.bind(this);

        this._model = new LiveConsoleModel(this._onNumMatchesChanged);


        parentContext.handlePropertyChanged(this.onParentPropertyChanged);
    }

    public onUnLoad() {
        console.log('LiveConsoleViewModel::::ON UN** LOAD');

        this.stopEventsTracking().then(() => {
            this.parentContext.unregisterPropertyChangeHandler(this.onParentPropertyChanged);
        }).catch(() => {
            this.parentContext.unregisterPropertyChangeHandler(this.onParentPropertyChanged);
        });
    }

    public onLoad() {

        console.log('LiveConsoleViewModel::::ON LOAD');

        const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;
        this.startEventsTracking(castedParentContext.getSelectedData(), castedParentContext.getDataService());

        this._model.paused = false;
        this._model.title = this._dataSerivce.getMetaData(this._model.selectedQueryDetails.data).getTitle();
        this._model.subtitle = this._dataSerivce.getMetaData(this._model.selectedQueryDetails.data).getSubTitle();


        let safeSelectedPillValue: string = '';
        if (this.parentContext && this.parentContext.model
            && this.parentContext.model.selectedPill && this.parentContext.model.selectedPill.value) {
            safeSelectedPillValue = this.parentContext.model.selectedPill.value;
        }

        // Selected Tab information will need to be available here when more tabs are present
        this.telemetry.logEvent('DeploymentsLiveConsole', { safeSelectedPillValue: safeSelectedPillValue, selectedTab: 'Events' }, null);

        this.propertyChanged('LiveConsoleViewModel.title');
        this.propertyChanged('LiveConsoleViewModel.subtitle');
    }

    public startEventsTracking(queryParameters: IQueryParameters, dataService: ILiveDataService) {

        if (this._dataSerivce !== null) {
            throw 'Live console tracking called twice!';
        }

        this._dataSerivce = dataService;

        this._model.selectedQueryDetails = queryParameters;

        const registration = RefreshService.Instance()
            .registerRefreshInterval(1000, () => this._eventTrigger(), true);
        this._model.selectedQueryDetails.refreshRegistration = registration;

        this.propertyChanged('LiveConsoleViewModel.queryParameters');
    }

    public stopEventsTracking(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const registration = this._model.selectedQueryDetails;
                if (!registration) {
                    reject('Stop tracking invoked but the object is in incorrect state');
                }

                RefreshService.Instance().cancelRegistration(registration.refreshRegistration.refreshIntervalId).then(() => {
                    this._dataSerivce = null;

                    this._model.selectedQueryDetails = null;
                    this.propertyChanged('LiveConsoleViewModel.queryParameters');

                    resolve();
                }).catch((e) => {
                    reject(e);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    public get title() {
        return this._model.title;
    }

    public get subtitle() {
        return this._model.subtitle;
    }

    public get totalSearchResults(): number {
        return this._model.matchingIndexes.length;
    }

    public get selectedMatchIndex(): number {
        if (this._model.currentSelectedIndex < 0) {
            return 0;
        } else {
            return this._model.currentSelectedIndex + 1;
        }
    }

    public get searchTerm(): string {
        return this._model.searchTerm;
    }

    public get pillOptionList(): DropDownOption[] {
        const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;

        if (!castedParentContext.getPillOptions()) {
            return [{ value: '', label: '' }];
        }

        return castedParentContext.getPillOptions();
    }

    public get selectedPillOption(): DropDownOption {
        const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;

        if (!castedParentContext.getSelectedPill()) {
            return { value: '', label: '' };
        }

        return castedParentContext.getSelectedPill();
    }

    public get selectedIndex(): number {
        return this._model.currentSelectedIndex;
    }

    public get matchingIndicies(): number[] {
        return this._model.matchingIndexes;
    }

    public get eventsCache(): CellMeasurerCache {
        return this._model.eventsCache;
    }

    public moveToNextSearchResult() {
        const value = this._model.matchingIndexes.length - 1 > this._model.currentSelectedIndex
            ? this._model.currentSelectedIndex + 1
            : 0;

        this._model.currentSelectedIndex = value;
        this.telemetry.logEvent(
            'LiveConsoleMoveToNextSearchResult',
            {
                currentIndex: this._model.currentSelectedIndex.toString(),
                totalItems: this._model.matchingIndexes.length.toString()
            },
            null
        );
        this.propertyChanged('LiveConsoleViewModel.currentSelectedIndex');
    }

    public moveToPreviousSearchResult() {
        const value = this._model.currentSelectedIndex > 0
            ? this._model.currentSelectedIndex - 1
            : this._model.matchingIndexes.length - 1;

        this._model.currentSelectedIndex = value;
        this.telemetry.logEvent(
            'LiveConsoleMoveToPrevSearchResult',
            {
                currentIndex: this._model.currentSelectedIndex.toString(),
                totalItems: this._model.matchingIndexes.length.toString()
            },
            null
        );
        this.propertyChanged('LiveConsoleViewModel.currentSelectedIndex');
    }

    public toggleLivePanelPauseState() {
        if (this.isLiveConsolePaused()) {
            this._model.paused = false;

            console.log('LiveConsoleViewModel::::toggleLivePanelPauseState');
            this.onLoad();
            this.propertyChanged('LiveConsoleViewModel.paused');
        } else {
            this.stopEventsTracking().then(() => {
                this._model.paused = true;
                this.propertyChanged('LiveConsoleViewModel.paused');
            });
        }

        this.telemetry.logEvent('LiveConsolePauseToggle', { currentState: this._model.paused.toString() }, null);
    }

    public clearSearchTerm(): void {
        this._clearSeaerchTerm('');
        this.telemetry.logEvent('LiveConsoleSearchTermCleared', null, null);
    }

    public onSearchTermChanged(event: React.ChangeEvent<HTMLInputElement>): void {
        if (event) {
            event.persist();
            if (event.target) {
                let searchTerm = event.target.value;
                this._model.searchTerm = searchTerm;
                this._clearSeaerchTerm(searchTerm);
                this.propertyChanged('LiveConsoleViewModel.searchBarItem');
            }
        }
    }

    public onLiveQueryTypeChanged(value: OptionValues) {
        this.stopEventsTracking().then(() => {
            const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;
            castedParentContext.changePillSelection(value);
        });
    }

    public hideLiveConsole() {
        const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;
        if (this.isLiveConsolePaused()) {
            castedParentContext.setLiveConsoleVisibility(false);
            this._model.paused = false;
        } else {
            this.stopEventsTracking().then(() => {
                castedParentContext.setLiveConsoleVisibility(false);
                this._model.paused = false;
            });
        }
        this.telemetry.logEvent('LiveConsoleClosed', null, null);
    }

    public getLiveConsoleQueryResultCount(): number {
        return this._model.logItemCount;
    }

    public isLiveConsolePaused(): boolean {
        return this._model.paused;
    }

    public getLiveConsoleQueryResultStatus(): boolean {
        return this._model.liveDataQuerySuccess;
    }

    public getEventsBuffer(): LogBufferManager {
        return this._model.eventsBuffer;
    }

    private _clearSeaerchTerm(searchTerm: string): void {
        this._model.searchTerm = searchTerm;
        this._model.eventsBuffer.changeSearchTerm(searchTerm);
        this.propertyChanged('ConsoleViewPanelViewModel.searchTerm');
    }

    private onParentPropertyChanged(propertyName: string) {
        const castedParentContext = this.parentContext as ILiveConsoleRefreshViewParentContext;
        if (!castedParentContext.isLiveConsoleVisible()) {

            if (this._model.selectedQueryDetails) {
                this.hideLiveConsole();
            }

            return;
        }

        if (propertyName === MainPaneBindables.IsLiveConsoleVisible) {
            console.log('LiveConsoleViewModel::::IsLiveConsoleVisible State Toggle', castedParentContext.isLiveConsoleVisible());
            this.onLoad();
        }

        if (propertyName === MainPaneBindables.DeploymentId) {
            this.stopEventsTracking().then(() => {
                console.log('LiveConsoleViewModel::::DeploymentId Toggled');
                this.onLoad();
            }).catch(() => {
                console.log('LiveConsoleViewModel::::DeploymentId Toggled Oops Crashed');
                // TODO: telemetry!
                this.onLoad();
            });
        }

        if (propertyName === MainPaneBindables.PillSelection) {
            this.onLoad();
        }
    }

    private _onNumMatchesChanged(newNumMatches: number, matchingIndexes: Set<number>): void {
        polyfillArrayFrom();
        
        if (newNumMatches !== this._model.numMatches) {
            this._model.currentSelectedIndex = 0;
        }

        this._model.numMatches = newNumMatches;
        this._model.matchingIndexes = Array.from(matchingIndexes).sort((n1: number, n2: number) => n1 - n2);

        this._resetSearchIndexIfRequired();

        this.propertyChanged('LiveConsoleViewModel.numMatches');
        this.propertyChanged('LiveConsoleViewModel.matchingIndexes');
    }

    private _resetSearchIndexIfRequired() {
        if (this._model.currentSelectedIndex + 1 > this._model.numMatches) {
            this._model.currentSelectedIndex = this._model.numMatches - 1;
        }

        if (this._model.numMatches > 0 && this._model.currentSelectedIndex < 0) {
            this._model.currentSelectedIndex = 0;
        }
    }

    private _eventTrigger(): Promise<number> {
        const registration = this._model.selectedQueryDetails;

        if (!registration) {
            throw 'Registration does not exist for panel';
        }

        return new Promise<number>((resolve, reject) => {
            this._dataSerivce.queryData(registration.data).then((newEvents: ILogItem[]) => {

                this._model.logItemCount = newEvents.length;
                this._model.liveDataQuerySuccess = true;

                this._model.resetCache();
                this._model.eventsBuffer.set(newEvents);

                this._resetSearchIndexIfRequired();

                this.propertyChanged('LiveConsoleViewModel.eventsBuffer');
                resolve(0);
            }).catch((error: any) => {
                console.log(error);
                this._model.liveDataQuerySuccess = false;
                this._model.logItemCount = 0;
                reject();
            });
        });


    }
}
