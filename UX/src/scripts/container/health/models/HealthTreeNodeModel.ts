/** local */
import { HealthState } from '../HealthState';

/**
 * MVVM model for health monitor tree node component
 */
export class HealthTreeNodeModel {
    /** monitor (instance) id */
    private _monitorIdentifier: string;

    /** in-tree display name */
    private _inTreeDisplayName: string;

    /** monitor state */
    private _state: HealthState;

    /** member monitors */
    private _children: string[];

    /** member monitors sorted for displaying in a list*/
    private _sortedChildren: string[];

    /** whether monitor node is selected */
    private _isSelected: boolean;

    /** whether monitor node is expanded */
    private _isExpanded: boolean;

    /**
     * initializes a new instance of the class
     * @param monitorIdentifier monitor (instance) id
     * @param inTreeDisplayName monitor display name
     * @param state monitor state
     * @param children member monitors
     * @param isSelected a value indicating whether monitor selected
     * @param isExpanded a value indicating whether monitor node must be expanded by default
     */
    public constructor(
        monitorIdentifier: string,
        inTreeDisplayName: string,
        state: HealthState,
        children: string[],
        isSelected: boolean,
        isExpanded: boolean
    ) {
        if (!monitorIdentifier) { throw new Error(`@monitorIdentifier may not be null at HealthMonitorModel.ctor()`); }
        if (!inTreeDisplayName) { throw new Error(`@inTreeDisplayName may not be null at HealthMonitorModel.ctor()`); }

        this._monitorIdentifier = monitorIdentifier;
        this._inTreeDisplayName = inTreeDisplayName;
        this._state = state;
        this._children = children;
        this._isSelected = isSelected;
        this._isExpanded = isExpanded;

        this._sortedChildren = null;
    }

    /** 
     * gets monitor (instance) id 
     */
    public get monitorIdentifier(): string {
        return this._monitorIdentifier;
    }

    /** 
     * gets monitor display name
     */
    public get inTreeDisplayName(): string {
        return this._inTreeDisplayName;
    }

    /** 
     * gets monitor state 
     */
    public get state(): HealthState {
        return this._state;
    }

    /** 
     * gets a value indicating whether monitor tree node is selected 
     */
    public get isSelected(): boolean {
        return this._isSelected;
    }

    /** 
     * gets a value indicating whether monitor tree node is expanded 
     */
    public get isExpanded(): boolean {
        return this._isExpanded;
    }

    /**
     * gets member monitor (children) instance ids
     */
    public get children(): string[] {
        return this._children;
    }

    /**
     * gets sorted member monitor (children) instance ids
     */
    public get sortedChildren(): string[] {
        return this._sortedChildren;
    }

    /**
     * sets member monitor (children) instance ids
     */
    public set sortedChildren(children: string[]) {
        this._sortedChildren = children;
    }

    /**
     * toggles whether monitor tree node is expanded
     */
    public toggleExpand(): void {
        this._isExpanded = !this._isExpanded;
    }
}
