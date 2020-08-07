

declare module HyperGraph.Layout {

    /**
     * Layout interfaces were moved here from the Service Map layout manager component.
     * Each solution should be able to provide their own implementations.
     * 
     * It has the capability of supporting three update patterns:
     * 1. Scratch: only nodes & edges added since the last doLayout call are used.
     * 2. Incremental: previous state is preserved and add/remove calls update that model (NOT SUPPORTED YET).
     * 3. Incremental + diff: caller updates entire model each time and layout service performs a diff against old model.
     *    Remove calls are not necessary since the layout service will remove unreferenced elements.
     *
     * Set the incremental flag to true for update pattern #3.
     */
    export interface ILayoutManager {

        /**
         * Behaves like upsert. Adds node or marks existing node as included in the layout. 
         * Updates properties, e.g. existing node style  expansion state.
         */
        addNode(id: string, parentId: string, rootId: string, expanded: boolean, nodeStyle?: INodeStyle): LayoutNode;

        addEdge(source: string, destination: string, resourceId?: string): LayoutEdge;

        /**
         * Processes the add/remove command queue to build a layout model, then calls yFiles
         * layouter to lay out the graph. Height, width and position are updated.
         * Returns LayoutGraph containing LayoutNode and LayoutEdge objects.
         */
        doLayout(layoutUpdatePattern: LayoutUpdatePattern, suggestedNodeOrder?: NodeOrderMap): LayoutGraph;
        clearGraph();
        isLayoutTypeSupported(layoutUpdatePattern: LayoutUpdatePattern): boolean;
    }
    
    export interface LayoutNode {
        id: string;
        parentId: string;
        rootId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        isExpanded: boolean;
        isVisible: boolean;
        numChildren?: number;
        nodeStyle: INodeStyle;
        destinationId?: string;
        isAddedSinceLastLayout?: boolean;
    }

    /**
     * Set by layout service if edge routing is supported
     */
    export interface LayoutEdge {
        id: string;
        source: string;
        destination: string;
        segments: number[][];
        isVisible: boolean;
        sourceEdgePort: EdgePort;
        targetEdgePort: EdgePort;
        isAddedSinceLastLayout?: boolean;
    }

    export interface LayoutGraph {
        bb: BoundingBox;
        nodes: LayoutNode[];
        edges: LayoutEdge[];
    }
       
    export interface BoundingBox {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export interface SpacingBox {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }

    export const enum EdgePort {
        Center,
        Top1,
        Top2,
        Top3,
        Right1,
        Right2,
        Bottom1,
        Bottom2,
        Bottom3,
        Left1,
        Left2
    }
 
    export interface INodeStyle {
        name: string;
        width: number;
        height: number;
        contentLayout: LayoutStyle; // enum: list, orthog, ring
        margin: SpacingBox;         // outside of node
        padding: SpacingBox;        // inside node between border and child content bounds
    }   
    
    // fixme: should this be extensible?
    // seems like the layout manager should register its layout style somewhere
    export const enum LayoutStyle {
        List,
        Ihl
    }

    export const enum RoutingStyle {
        Polyline,
        Orthogonal
    }

    // Internal enum used by LayoutManager and custom layouters
    export const enum LayoutMode {
        Scratch,
        Incremental
    }

    // The model no longer uses this concept. Instead it's always IncrementalDiff and
    // the model can be cleared before an update for Scratch behavior. The model generates
    // an event that provides diff information.
    export const enum LayoutUpdatePattern {
        Scratch,
        Incremental,
        IncrementalDiff
    }

    export interface ILayoutAlgorithm {
        applyLayout(graph: any,
            mode: LayoutMode,
            incrementalNodes?: IncrementalNodesMap,
            incrementalEdges?: IncrementalEdgesMap,
            nodeOrderMap?: NodeOrderMap ): void;
    }

    export interface LayoutOptions {
        syntheticEdges?: boolean;
    }

    // Map of nodes to be treated as incremental
    export type IncrementalNodesMap = { [id: string]: LayoutNode };

    // Map of edges to be treated as incremental
    export type IncrementalEdgesMap = { [id: string]: LayoutEdge };

    // Map of node id to relative order in parent
    export type NodeOrderMap = { [id: string]: string[] };
}



declare module HyperGraph {
    interface D3EventHandler {
        (datum: any, index: number, outerIndex: number): any;
    }
    interface GraphEventHandler {
        (event: Event, node: GraphEntity, action: string, domId: string, resolvedTarget: any): void;
    }
    class Controller implements Disposable {
        widget: GraphWidget;
        interactionAdapter: InteractionStateMachine;
        private _mouseCapture;
        /** If true, disable zoom in/out behavior on mouse wheel events. Default to false. */
        disableMouseWheelZoom: boolean;
        private _sharedHandlerMap;
        private _eventHandlerMap;
        constructor(widget: GraphWidget);
        dispose(): void;
        /**
         * Sets up event handlers for interacting with the control. They're added for auto-disposal.
         */
        initEventHandlers(): void;
        addMouseCaptureHandlers(dragMouseMoveHandler: (e: MouseEvent) => void, dragMouseUpHandler: (e: MouseEvent) => void): void;
        addEventHandlers(eventHandlers: {
            [key: string]: GraphEventHandler;
        }): void;
        protected _sharedEventHandler(evt: Event, datum: any): void;
        removeEventHandlers(): void;
        /**
         * Callback for when the user moves the mouse after pressing a mouse button.
         */
        private _dragMouseMove;
        /**
         * Callback for when the user releases a mouse button.
         *
         * @param e The mouse event.
         */
        private _dragMouseUp;
        /**
         * Callback for when the user hovers a graph entity with a mouse.
         * @param graphEntity the view model backing the thing which they hovered.
         */
        /**
         * Callback for when the user leaves a hover off a graph entity with a mouse.
         * @param graphEntity the view model backing the thing which they left the mouse hover.
         */
        /**
         * Callback for when the user right-clicks on a graph entiry.
         * Long touch (hammer event press) also defaults to right-click.
         *
         * @param graphEntity the view model backing the thing which was right-clicked.
         * @param evt the event object defining the right-click.
         */
        private _entityMouseRightClick;
        /**
         * Callback for when the user presses a mouse button on a graph entity.
         *
         * @param graphEntity the view model backing the thing on which they pressed the mouse button.
         * @param e The mouse event.
         */
        private _entityMouseDown;
        /**
         * Callback for then the user releases a mouse button on a graph entity.
         *
         * @param graphEntity the view model backing the thing on which they released the mouse button.
         * @param e The mouse event.
         */
        private _entityMouseUp;
        private _entityFocusIn;
        /**
         * Callback for when the user presses a mouse button on the canvas.
         *
         * @param canvasViewModel Unused, but Knockout passes view models first in its event binding.
         * @param e The mouse event.
         */
        private _canvasMouseDown;
        /**
         * Callback for when the user releases a mouse button on the canvas.
         *
         * @param canvasViewModel Unused, but Knockout passes view models first in its event binding.
         * @param e The mouse event.
         */
        private _canvasMouseUp;
        /**
         * Callback for when the user scrolls the mouse wheel.
         *
         * The default behavior is for the mouse wheel to zoom the graph control in or out.
         * If the disableMouseWheelZoom option is set to true, the mouse wheel will instead pan the graph control up or down.
         *
         * @param e The mouse wheel event. This could be WheelEvent or MouseWheelEvent, depending on what the browser supports.
         */
        private _mouseWheel;
        /**
         * Callback for when the graph control resizes for any reason.
         */
        private _resize;
        /**
         * Callback for when the user mousedowns on the scrollbar. Stops events from propagating.
         *
         * @param viewModel The view model of the graph control.
         * @param e The mouse event.
         * @return Returns to true to tell Knockout to not prevent default.
         */
        private _scrollBarMouseDown;
        /**
         * Callback for when the user slides the horizontal scrollbar.
         *
         * @param e The scroll event.
         */
        private _scrollX;
        /**
         * Callback for when the user slides the vertical scrollbar.
         *
         * @param e The scroll event.
         */
        private _scrollY;
        /**
         * Handles key down events when the user presses a keyboard key.
         * @param e The keyboard event.
         */
        private _canvasKeyDown;
        /**
         * Callback for when the user depresses a keyboard key.
         *
         * @param e The keyboard event.
         */
        private _keyUp;
        /**
        * Handles the beginning and end of all gestures.
        *
        * @param e The gesture event
        */
        /**
         * Zooms and pans using a Hammer pinch event.
         *
         * @param e The pinch event
         */
        /**
         * Handles the screen being dragged.
         *
         * @param e The drag event
         */
        /**
        * Handles the screen being tapped.
        *
        * @param e The tap event
        */
        /**
        * Pans with inertia using a Hammer swipe event.
        *
        * @param e The swipe event
        */
        /**
         * Handles a hold on the screen.
         *
         * @param e The hold event
         */
        /**
         * Handles a tap on an entity.
         *
         * @param viewModel The GraphEntity of the entity being handled
         * @param e The tap event
         */
        /**
        * Handles a doubletap on an entity.
        * Note: when the user doubletaps, only the doubletap event will fire, not a second tap event.
        *
        * @param viewModel The GraphEntity of the entity being doubletapped
        * @param e The doubletap event
        */
        /**
         * Returns true if the specified event's target or any of its ancestors has the 'msportalfx-graph-ignore-input' CSS class
         *
         * @param e The event with the target element to check
         * @return A Boolean indicating whether the Graph should ignore the event
         */
        private _ignoreEvt;
        /**
         * Returns a string with the name of the mouse wheel event handler to listen to
         *
         * @param el The element to attach the event listener to
         * @return A string with the name of the event to listen to
         */
        private _getMouseWheelEventName;
    }
}

/// <reference types="q" />
declare module HyperGraph {
    /** Actions the user can take on the graph control. */
    const enum InteractionAction {
        /** The user double-clicked in a graph control using any mousebutton. */
        MouseDoubleClick = 0,
        /** The user pressed any mouse button in the graph control (on an entity, the canvas, etc.) */
        MouseDown = 1,
        /** The user released any mouse button in the graph control (on an entity, the canvas, etc.) */
        MouseUp = 2,
        /** The user dragged the mouse. */
        MouseMove = 3,
        /** The user pressed the delete key. */
        DeleteKeyPressed = 4,
        /** The user pressed the escape key. */
        EscapeKeyPressed = 5,
        /** The user pressed the 'A' key while holding shift. */
        CtrlAPressed = 6,
        /** The user pressed F2. */
        F2KeyPressed = 7,
        /** The user pressed 'X' while holding control. */
        ControlXPressed = 8,
        /** The user pressed the spacebar key */
        SpacebarDown = 9,
        /** The user depressed the spacebar key. */
        SpacebarUp = 10,
        /** The user pressed the up arrow. */
        UpKeyPressed = 11,
        /** The user pressed the down arrow. */
        DownKeyPressed = 12,
        /** The user pressed the left arrow. */
        LeftKeyPressed = 13,
        /** The user pressed the right arrow. */
        RightKeyPressed = 14,
        /** The user pressed the enter key */
        EnterKey = 15,
        /** The user is tabbing through the graph. Overridden only when the graph has focus */
        TabKey = 16,
        /** The user tapped an entity. */
        EntityTapped = 17,
        /** The key associtated with zooming in */
        ZoomInKeyPressed = 18,
        /** The key associated with zooming out */
        ZoomOutKeyPressed = 19,
        /** The key associated with zoom fill */
        ZoomFitKeyPressed = 20,
        /** The key associated with zooming to 100% */
        Zoom100PercentKeyPressed = 21,
        /** Changes the behavior of the tab key */
        TabBehaviorChange = 22,
        /** The user doubletapped a node. */
        NodeDoubleTapped = 23,
        /** The user dragged a node. */
        NodeDragged = 24,
        /** The user held a node. */
        NodeHeld = 25,
        /** The user entered edge creation mode */
        EdgeCreateStartKey = 26,
        /** The user entered edge select mode. */
        EdgeSelectKey = 27,
        /** The user dragged the sceen. */
        ScreenDragged = 28,
        /** The user pinched the screen. */
        ScreenPinched = 29,
        /** The user swiped the screen. */
        ScreenSwiped = 30,
        /** The user held the screen. */
        ScreenHeld = 31,
        /** The user tapped the screen. */
        ScreenTapped = 32,
        /** The user started a gesture. */
        GestureStarted = 33,
        /** The user ended a gesture. */
        GestureEnded = 34,
    }
    enum Direction {
        Left = 0,
        Right = 1,
        Up = 2,
        Down = 3,
        Descend = 4,
        Ascend = 5,
    }
    enum ElementType {
        Node = 0,
        Edge = 1,
        GroupMember = 2,
        ProcessNode = 3,
        ProcessGroupNodeLink = 4,
        ContextMenu = 5,
        PrevOrNext = 6,
    }
    class InteractionStateMachine {
        /** True if the user isn't currently performing an interaction. */
        /** The intent behind the current drag operation. None if the user isn't dragging. */
        dragging: DraggingMode;
        /** The interaction mode for keyboard input. */
        interactionMode: GraphInteractionMode;
        /** CSS classes to put on the DOM as a result of the user's interaction. */
        /** True if we're currently panning with inertia */
        private _inertiaPanning;
        inertiaPanning: boolean;
        private _inertiaVelocityX;
        private _inertiaVelocityY;
        private _lastInertiaTime;
        private _widget;
        private stage;
        private _lastMouseCoords;
        private _lastDomainCoords;
        private _lastTouchCoords;
        private _lastTouchDomainCoords;
        private _lastTouches;
        private _lastSelectTime;
        private _touchHeld;
        private _leftMousePanning;
        private _centerMousePanning;
        private _spacebarHeld;
        private _mouseDownDomainCoords;
        private _mouseDownEvent;
        private _mouseDownEntity;
        private _gestureScale;
        private _gestureDomainCoords;
        private _gesturing;
        private _pendingClearSelection;
        private _focusIndex;
        /** The start point for the multi-selection rectangle */
        multiSelectStartPoint: IPoint;
        /** The current end point for the multi-selection rectangle */
        multiSelectCurrentPoint: IPoint;
        private _multiSelecting;
        /** Used by shift+tab to correctly go back to previous element */
        private activeGraphElementStack;
        /** The buffer to which to compare two points against or to measure proximity */
        private readonly epsilon;
        /**
         * Creates a state machine for handling user interation.
         *
         * @param widget The parent widget that will use this state machine.
         */
        constructor(widget: GraphWidget);
        atRest(): boolean;
        isPanning(): boolean;
        /**
         * Responds to a user action.
         *
         * @param action The user's action.
         * @param e If the action is a mouse or keyboard action, the associated event.
         * @param relevantEntity If acting upon something in the graph widget, what they're acting on.
         */
        handleAction(action: InteractionAction, e?: Event, relevantEntity?: GraphEntity, customAction?: string): void;
        bumpSelection(direction: Direction): void;
        /**
         * Finds nearest Entity based on supplied direction. To keep things simple, we use node
         * centers, not sides.
         *
         * Returns null if there is no node in the specified direction.
         *
         * @param focusedNode
         * @param direction
         */
        private _findClosestEntity(focusedEntity, direction);
        private findFirstVisiableEdge(entities);
        focusOnGraphEntity(graphEntity: GraphEntity): Q.Promise<any>;
        /**
         * Brings a graph node into view and selects it.
         *
         * @param graphNodeViewModel the view model for the graph node to focus on
         */
        focusOnGraphNode(graphNode: GraphNode): Q.Promise<any>;
        /**
         * Brings a graph edge into view and selects it.
         *
         * @param graphNodeViewModel the view model for the graph edge to focus on
         */
        focusOnGraphEdge(graphEdge: GraphEdge): Q.Promise<any>;
        /**
        * Starts inertia at specified velocities.
        *
        * @param inertiaVelocityX Signed velocity in the x direction.
        * @param inertiaVelocityY Signed velocity in the y direction.
        */
        startInertia(inertiaVelocityX: number, inertiaVelocityY: number): void;
        /**
         * Dispose of the state machine.
         */
        dispose(): void;
        private getNextTopLeftMostNode(activeBox?);
        private getNextTopLeftMostEdge(activeBox?);
        private getNextTopLeftMostGroupMember(activeBox?, proximity?);
        private getNextTopLeftMostProcessNode(activeBox?, proximity?);
        private getNextTopLeftMostProcessGroupNodeLink(activeBox?, proximity?);
        private getNextTopLeftMostContextMenu(activeBox?, proximity?);
        private getNextTopLeftMostPrevOrNext(activeBox?, sameColumn?);
        /**
         * Finds the "next" top-leftmost element. If `activeBox` is provided, the next element is found in relation to
         * that by first evaluating y-axis from top-to-bottom then x-axis from left-to-right. If `proximity` is provided,
         * it is found in relation to proximity of `activeBox` by ensuring it is within epsilon distance of it.
         *
         * @param elementType get list of these element types to look to jump to
         * @param activeBox ClientRect of active element
         * @param proximity look within proximity of activeBox, for example to go to next item within a list but they share no relevant parent
         * @param sameColumn don't go left, stay in the same x-axis area
         */
        private getNextTopLeftMostElement(params);
        private findClosestIndex(activeTop, activeLeft, elements, proximityBox?);
        private previouslySeen(left, top);
        private nextColumn(activeLeft, nodeContainers);
        private focusTopLeftMostNode();
        private focusTopLeftMostEdge();
        private focusNextNodeOrEdge();
        private focusNextEdge();
        /**
         * Evaluates if point is within epsilon distance from origin
         *
         * @param point typically some variable we want to evaluate
         * @param origin typically a fixed point to which we compare against
         */
        private within(point, origin, customEpsilon?);
        /**
         * Evaluates if the point is within proximity of `proximityBox` by taking
         * in the height of the `ClientRect` (i.e. bottom)
         *
         * @param point x-y pair
         * @param proximityBox
         */
        private withinProximity(point, proximityBox);
        /** Helper methods for tab navigation */
        private isDependencyMapActiveElement();
        private isNodeActiveElement();
        private focusOnNodesOwnExpand();
        private isActiveElementVirtualGroupNodeCircle();
        private isActiveElementVirtualGroupNodeContextMenu();
        private isActiveElementWithinVirtualGroupNode();
        private isActiveElementWithinGroupMemberNode();
        private isActiveElementGroupMemberBar();
        private isActiveElementWithinClientOrServerGroup();
        private isActiveElementWithinMachineNode();
        private isActiveElementMachineNode();
        private isActiveElementClientOrServerGroup();
        private isActiveElementCircle();
        private isActiveElementEdge();
        private isActiveElementExpand();
        private isActiveElementContextMenu();
        private isActiveElementWithinProcessNode();
        private isActiveElementClassLink();
        private isActiveElementContextMenuOption();
        private isActiveElementPrevOrNext();
        private focusOnContextMenuExpand();
        private focusNextGroupMemberNode(noProximity?);
        private focusActiveGroupMembersOwnMenu();
        private focusOnMachineNodesOwnContextMenu();
        private focusNextProcessNode(proximity?);
        private focusNextProcessGroupNodeLink(proximity?);
        private focusNextContextMenu(proximity?);
        private focusOnPrevOrNext();
    }
}

declare module HyperGraph {
    enum KeyCode {
        Alt = 18,
        Backslash = 220,
        Backspace = 8,
        Comma = 188,
        Control = 17,
        Delete = 46,
        Down = 40,
        End = 35,
        Enter = 13,
        Equals,
        Escape = 27,
        F10 = 121,
        Home = 36,
        Left = 37,
        Menu = 93,
        Minus,
        PageDown = 34,
        PageUp = 33,
        Period = 190,
        Right = 39,
        Shift = 16,
        Slash = 191,
        Space = 32,
        Tab = 9,
        Up = 38,
        A = 65,
        B = 66,
        C = 67,
        D = 68,
        E = 69,
        F = 70,
        G = 71,
        H = 72,
        I = 73,
        J = 74,
        K = 75,
        L = 76,
        M = 77,
        N = 78,
        O = 79,
        P = 80,
        Q = 81,
        R = 82,
        S = 83,
        T = 84,
        U = 85,
        V = 86,
        W = 87,
        X = 88,
        Y = 89,
        Z = 90,
        Num0 = 48,
        Num1 = 49,
        Num2 = 50,
        Num3 = 51,
        Num4 = 52,
        Num5 = 53,
        Num6 = 54,
        Num7 = 55,
        Num8 = 56,
        Num9 = 57,
        NumMinus = 109,
        NumPlus = 107,
    }
}

declare module HyperGraph {
    const enum MouseButton {
        Left = 1,
        Middle = 2,
        Right = 3,
    }
    /**
     * A wrapper for registering and unregistering events.
     */
    class EventListenerSubscription {
        private _handler;
        private _useCapture;
        private _eventType;
        private _element;
        /**
         * Constructs a wrapper for event listeners that can remove them on dispose.
         *
         * @param element The element on which to attach the listener.
         * @param eventType The type of event to register (e.g. mousedown, focus, etc.).
         * @param handler The callback to fire when the event occurs.
         * @param useCapture False uses bubble semantics. True uses capture semantics.
         */
        constructor(element: EventTarget, eventType: string, handler: (e: Event) => void, useCapture?: boolean);
        /**
         * Remove the registered event listeners.
         */
        dispose(): void;
    }
    /**
     * A class for handling and tracking drags. Works if the user drags anywhere on the screen, even outside the browser window.
     * Works with multiple mouse buttons and retains the drag until all buttons are released.
     */
    class MouseCapture {
        private _buttonsDown;
        private _mouseMoveHandler;
        private _mouseUpHandler;
        private _beginCapture;
        private _endCapture;
        private _mouseDownOrigin;
        private _mouseUpSubscription;
        private _mouseMoveSubscription;
        private _endCaptureSubscription;
        private _countMouseDownsSubscription;
        private _beginCaptureSubscription;
        /**
         * Create a mouse capture class that tracks mouse drags.
         *
         * @param mouseDownOrigin The element on which a mouse down begins tracking a drag.
         * @param mouseMoveHandler What to do when the user drags the mouse with a button down.
         * @param mouseUpHandler What to do when the user releases a mouse button in the drag.
         */
        constructor(mouseDownOrigin: Element, mouseMoveHandler: (e: MouseEvent) => void, mouseUpHandler: (e: MouseEvent) => void);
        /**
         * Disposes of the mouse capture class.
         */
        dispose(): void;
    }
}

/// <reference types="jquery" />
declare module HyperGraph {
    var EventTypes: {
        animationstart: string;
        resize: string;
        scroll: string;
    };
    class Resize {
        static getDetectionFragment(containerClass: string): string;
        static getChildren(element: JQuery, className: string): JQuery;
        /**
         * Hooks up cross browser resize detection event (ie, webkit, moz, edge).
         *
         * @param lifetime The lifetime of the resize tracking.
         * @param element The element to monitor size changes.
         * @param handler The resize event handler.
         */
        static track(lifetime: LifetimeManager, element: JQuery, handler: (width?: number, height?: number) => void): void;
    }
}

declare module HyperGraph {
}



declare module HyperGraph.Layout {
    /**
     * A layer means one column in Heirarchical layout
     * Layer maintains all root nodes in one column. It does not maintain child nodes.
     */
    class Layer {
        outgoingConnectionCount: number;
        layerX: number;
        layerY: number;
        layerWidth: number;
        layerHeight: number;
        private nodes;
        private nodeToNodeDistance;
        private nodeWithMaxWidth;
        private uniqueMap;
        constructor(nodes?: SHLayoutNode[]);
        AddNode(node: SHLayoutNode, outgoingConnectionCount: number): void;
        GetNodes(): SHLayoutNode[];
        readonly NodeCount: number;
        ComputeLayerSize(): void;
        /**
         * Compute y coordinate of this layer based on canvasHeight and node count in this layer.
         * ComputeLayerSize should be called before this method
         * @param {number} layerX
         * @param {number} canvasHeight
         * @returns {void}
         * @memberof Layer
         */
        ComputeLayerCoordinates(layerX: number, canvasHeight: number): void;
        ComputeNodesLayout(): void;
    }
}

declare module HyperGraph.Layout {
    class OrderedStringMap<T> {
        private list;
        private uniqueMap;
        constructor();
        add(id: string, item: T): void;
        get(id: string): T;
        values(startIndex?: number, endIndex?: number): T[];
        delete(id: string): void;
        readonly length: number;
    }
    class SHLayoutGraph {
        private adjacencyList;
        private reverseAdjacencyList;
        private allNodes;
        private levelZeroNodes;
        private edges;
        private nodeIdToNodeMap;
        private edgeIdToEdgeMap;
        constructor();
        ClearGraph(): void;
        readonly AllNodes: SHLayoutNode[];
        readonly AllEdges: LayoutEdge[];
        AddNode(node: SHLayoutNode): void;
        GetNode(id: string): SHLayoutNode;
        GetAllRootNodes(): SHLayoutNode[];
        /**
         * This method removes node which is not added as part of current layout algorithm
         * Update parent of the node as well if there is any.
         * @param nodeId
         */
        RemoveNode(id: string): void;
        AddEdge(edge: LayoutEdge): void;
        GetEdge(id: string): LayoutEdge;
        GetNeighbors(id: string): SHLayoutNode[];
        RemoveEdge(id: string): void;
        private getIndex(list, id);
    }
}

declare module HyperGraph.Layout {
    interface ISHLayoutNode extends HyperGraph.Layout.LayoutNode {
        edgePortCoordinates: NumberMap<Coordinate>;
        childNodes: ISHLayoutNode[];
    }
    /**
     * Represents node is layout graph. A node can be a machine/processGroup/process/clientGroup/clientGroupMember/serverGroup/serverGroupMember
     * @export
     * @class SHLayoutNode
     * @implements {ISHLayoutNode}
     */
    class SHLayoutNode implements ISHLayoutNode {
        id: string;
        /**
         * Immediate ancestor of the node.
         * ParentId of a root node is null.
         * For example, parentId of a process can be a processGroup or machine node.
         * ParentId of a machine node is null.
         * @type {string}
         * @memberof SHLayoutNode
         */
        parentId: string;
        /**
         * Top most ancestor of the node.
         * For example, rootId of a process can be machineNode even if it is descendant of a processGroup.
         * This field is used to access rootNode of any childNode in constant time.
         * @type {string}
         * @memberof SHLayoutNode
         */
        rootId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        /** @deprecated */
        isExpanded: boolean;
        /** @deprecated */
        isVisible: boolean;
        numChildren?: number;
        nodeStyle: INodeStyle;
        /**
         * This flag is used to decide if the node is added in current incremental layout or not.
         * After layout is completed, we set this flag of all nodes to false.
         * @type {boolean}
         * @memberof SHLayoutNode
         */
        isAddedSinceLastLayout?: boolean;
        edgePortCoordinates: NumberMap<Coordinate>;
        childNodes: SHLayoutNode[];
        private portCandidateYOffset;
        private childNodesMap;
        private incomingConnections;
        private outgoingConnections;
        constructor(node: HyperGraph.Layout.LayoutNode);
        readonly IncomingConnectionCount: number;
        readonly OutgoingConnectionCount: number;
        AddIncomingConnection(edge: LayoutEdge): void;
        RemoveIncomingConnection(edge: LayoutEdge): void;
        AddOutgoingConnections(edge: LayoutEdge): void;
        RemoveOutgoingConnection(edge: LayoutEdge): void;
        CalculateEdgePortCoordinates(): void;
        CalculateChildNodesCoordinates(): void;
        AddChildNode(childNode: SHLayoutNode): void;
        RemoveChildNode(childNode: SHLayoutNode): void;
        CalculateSize(): void;
        /**
         * Reset the size of the node with new node style.
         * @param {INodeStyle} nodeStyle
         * @memberof SHLayoutNode
         */
        ResetSize(nodeStyle: INodeStyle): void;
    }
}

declare module HyperGraph.Layout {
    interface SelfEdgeChannel {
        minY: number;
        maxY: number;
        edges: LayoutEdge[];
        merged: boolean;
    }
    interface MergedSelfEdgeChannel {
        range: number[];
        edges: LayoutEdge[];
    }
    class SelfEdgeLayoutManager {
        private readonly minDistanceFromNodes;
        private readonly distanceBetweenChannels;
        ComputeSelfLinksLayout(graph: SHLayoutGraph, selfEdges: LayoutEdge[]): void;
        private mergeSelfEdgeChannels(mergeBase, channel);
    }
}

/**
 * This layout algorithm works for single machine and group as single node.
 * FOr expanded group nodes, this algorithm will not work as it is.
 */
declare module HyperGraph.Layout {
    interface StringMap<T> {
        [key: string]: T;
    }
    interface NumberMap<T> {
        [key: number]: T;
    }
    interface Coordinate {
        x: number;
        y: number;
    }
    interface ITelemetryProvider {
        info: (message: string, source: string, action: string, props?: any) => void;
        error: (error: object | string, source: string, action: string, props?: any) => void;
    }
    class SimpleHierarchicalLayouter implements ILayoutManager {
        private graph;
        private layers;
        private selfEdgesLayoutManager;
        private edgeSegmentLength;
        private minimumLayerDistance;
        private nodeToNodeDistance;
        private singleSegmentEdgeErrorOffset;
        private canvasHeight;
        private canvasWidth;
        private telemetryProvider;
        constructor(telemetryProvider: ITelemetryProvider);
        clearGraph(): void;
        isLayoutTypeSupported(layoutUpdatePattern: LayoutUpdatePattern): boolean;
        addNode(id: string, parentId: string, rootId: string, expanded: boolean, nodeStyle: INodeStyle): LayoutNode;
        addEdge(source: string, destination: string): LayoutEdge;
        doLayout(layoutUpdatePattern?: LayoutUpdatePattern): LayoutGraph;
        /**
         * This method computes nodes layouts in each layer
         * @param layers
         * @param layerWithMaximumNodeCount
         */
        private computeNodesLayout();
        private computeEdgesLayout();
        private filterGraphForIncrementalDiff();
        /**
         * This method marks all nodes and edge's isAddedSinceLastLayout as false.
         * That means all these nodes will become stale once the layout is computed.
         */
        private markAllGraphElementsStaleForNextLayout();
        private isSelfEdge(edge);
    }
}


declare module HyperGraph {
    /** It works better to just highlight edges for selected nodes (no BFS traversal). */
    class AdjacencyEmphasis {
        private graphModel;
        private _forwardAdjacencyList;
        private _reverseAdjacencyList;
        constructor(graphModel: GraphModel);
        /** Create forward and backward adjacency list for the directed graph */
        createAdjacencyList(): void;
        /** Modify opacity of graph entities to display lineage of selected nodes. */
        updateAdjacencyEmphasis(selectedNodes: GraphNode[], targetElementId?: string): void;
        /**
         * Add adjacent nodes and edges to undimmed lists
         *
         * @param undimmedNodes Set of nodes that should not be dimmed
         * @param undimmedEdges Set of edges that should not be dimmed
         * @param adjacencyList Directed graph as adjacency list
         * @param selectedNodes List of nodes that have been selected
         */
        private _identifyEntitiesToEmphasize(emphasizedNodes, emphasizedEdges, adjacencyList, selectedNodes);
        clear(): void;
        /** Set adjacencyDimmed state for all nodes to be false */
        private _emphasizeAllEntities();
    }
}

declare module HyperGraph {
    enum EdgeDoubling {
        Single = 1,
        Double = 2,
    }
    enum EdgePattern {
        Solid = 1,
        Dotted = 2,
        Dashed = 3,
    }
    interface EdgeSegment extends IPoint {
        dx?: number;
        dy?: number;
    }
    function makeEdgeId(source: string, dest: string): string;
    class GraphEdge extends AbstractGraphEntity {
        sourceId: string;
        destId: string;
        sourceNode: GraphNode;
        destNode: GraphNode;
        constructor(sourceId: string, destId: string, sourceNode?: GraphNode, destNode?: GraphNode, props?: PropertyMap);
        protected setDefaultValues(): void;
        /** source and dest port ids*/
        sourcePortLocation: PortLocation;
        destPortLocation: PortLocation;
        /** Edge routing line segments, set by graphModel - set these to populate path */
        segments: EdgeSegment[];
        rawLayoutSegments: number[][];
        startPoint: IPoint;
        endPoint: IPoint;
        selfLink: boolean;
        /**
        If this value is set then the link will be visible in the graph only if source is visible
        and source node is selected.
        */
        clientGroupMemberLink: boolean;
        /**
        If this value is set then the link will be visible in the graph only if destination is visible
        and destination node is selected.
        */
        serverGroupMemberLink: boolean;
        /** overrides "hide self links" flag (e.g. for failed connection) */
        forceVisible: boolean;
        getBounds(): IRect;
        getLeftNode(): GraphNode;
        getRightNode(): GraphNode;
        getNextTopSibling(): GraphEdge;
        getNextDownSibling(): GraphEdge;
        private getSiblings();
        private getLeftToRightSegment(edge);
        private getRightY(segments);
    }
    class AggregateEdge extends GraphEdge {
        count: number;
        constructor(source: string, dest: string, props?: PropertyMap);
        protected setDefaultValues(): void;
        edgeSet: Dictionary<GraphEdge>;
        addEdge(edge: GraphEdge): void;
        removeEdge(edge: GraphEdge): void;
    }
    class EdgeSegmentImpl implements EdgeSegment {
        constructor(x: number, y: number);
        x: number;
        y: number;
        dx: number;
        dy: number;
    }
}

declare module HyperGraph {
    /**
     * CRUD state/lifecyle bit flags for model entities.
     * We want to be able to maintain Created and Updated states separately.
     */
    enum CrudState {
        Unchanged = 0,
        Created = 1,
        Updated = 2,
        Deleted = 4,
    }
    /** Base entity with property bag support. */
    interface PropertyEntity {
        id: string;
        isCreated: boolean;
        isUpdated: boolean;
        isDeleted: boolean;
        properties: PropertyMap;
        crud: CrudState;
        changeKeys: Dictionary<string>;
        /** User-defined visibility. Overrides all internal visibility flags.
        Note that an edge will hide automatically if its source node or dest node is not visible. */
        visible: boolean;
    }
    abstract class AbstractEntity implements PropertyEntity {
        id: string;
        private _properties;
        changeKeys: Dictionary<string>;
        constructor(id: string, properties?: PropertyMap);
        /** Calling reset on deleted object will reset to initial state - brings it back to life. */
        reset(properties?: PropertyMap): void;
        protected setDefaultValues(): void;
        dispose(): void;
        /** Nodes and edges are parents for their properties. When a property is added
        (or removed), the parent entity state is 'updated'. */
        readonly updated: boolean;
        readonly properties: PropertyMap;
        crud: CrudState;
        readonly isCreated: boolean;
        readonly isUpdated: boolean;
        readonly isDeleted: boolean;
        visible: boolean;
        wasPropertyChanged(key: string): boolean;
        addChangeKey(key: string): void;
        addChangeKeys(props: PropertyMap): void;
        updateChangeFlags(crud: CrudState, diff?: PropertyMap): void;
        hasProperty(key: string): boolean;
        getProperty(key: string): any;
        setProperty(key: string, value: any): void;
        updateProperties(properties: PropertyMap): PropertyMap;
    }
    interface Selectable {
        selected: boolean;
        selectable: boolean;
        focused: boolean;
    }
    interface GraphEntity extends Selectable, PropertyEntity {
        linkedEntities: GraphEntity[];
        domId: string;
        data: any;
        /** Used internally by graph model to control visibility, e.g. process nodes are not in layout when machine is collapsed. */
        inLayout: boolean;
        /** true: entity has been assigned layout coordinates by layout manager */
        hasLayoutPosition: boolean;
        /** shorthand for (visible && inLayout && hasLayoutPosition) */
        layoutVisible: boolean;
        /** true when AdjacencyEmphasis has dimmed an edge */
        adjacencyDimmed: boolean;
    }
    abstract class AbstractGraphEntity extends AbstractEntity implements GraphEntity {
        linkedEntities: GraphEntity[];
        domId: string;
        ariaLabel: string;
        constructor(id: string, properties?: PropertyMap);
        protected setDefaultValues(): void;
        dispose(): void;
        data: any;
        /** true: calculate layout for this entity */
        inLayout: boolean;
        /** true: valid layout position has been set for this entity */
        hasLayoutPosition: boolean;
        /** is set true by model when (visible && inLayout && hasLayoutPosition) */
        layoutVisible: boolean;
        /** Set according to lineage display logic. If true, the entity should have a low opacity. */
        adjacencyDimmed: boolean;
        selected: boolean;
        selectable: boolean;
        focused: boolean;
        getId(): string;
        /** Entity bounding rect */
        getBounds(): IRect;
        /**
        * Returns whether or not this entity completely resides in rect. Overloaded in child classes.
        * @param rect The enclosing rect to test.
        * @return true if this entity lies in the enclosing rect. False if not.
        */
        liesInRect(rect: IRect): boolean;
    }
}

declare module HyperGraph {
    enum ProgressState {
        Complete = 0,
        Reconcile = 1,
        Layout = 2,
        Render = 3,
    }
    /** Strategies defining how edges connect to nodes and how they follow the nodes' moves. */
    enum EdgeConnectionStrategy {
        /** Edge line is a ray originating at the center of the start node and going to the center of the end node. */
        NodeCenter = 0,
        /** Edge path is a Bezier curve originating at the output port of the start node and going to the input port of the end node. */
        NodePort = 1,
    }
    enum NodeType {
        Machine = 0,
        ProcessGroup = 10,
        ClientGroupV3 = 13,
        ServerGroupV3 = 14,
        VirtualGroupNode = 20,
    }
    /**
     * Used to provide implementation for a node orderer
     * E.g. provide an ordering of list nodes in a group node
     */
    interface NodeOrderer {
        setGraphModel(model: GraphModel): any;
        getSuggestedOrder(): {
            [id: string]: string[];
        };
    }
    interface IGraphModel<T, U> {
        addNode(id: string, properties?: Object): GraphNode;
        addEdge(sourceId: string, destinationId: string, sourceNode: GraphNode, destNode: GraphNode, props: PropertyMap): GraphEdge;
        getNode(id: string): T;
        getNodes(): T[];
        getChildNodes(node: T): T[];
        getEdge(id: string): U;
        getEdge(source: string, destination: string): U;
        getEdges(): U[];
        getSourceNode(edge: U): T;
        getDestinationNode(edge: U): T;
        removeNode(id: string): any;
        removeEdge(id: string): any;
        clear(forceClear: boolean): any;
        /**
         * Notifies all observers that the model has changed.
         * Renders the graph.
         */
        notify(): void;
        dispose(): any;
        createNodeHierarchy(): void;
        updateNodeProperties(id: string, properties: Object): boolean;
        currentExpansionLevel: number;
    }
    interface GraphModel extends IGraphModel<GraphNode, GraphEdge> {
        getEntities(): GraphEntity[];
        getRemovedNodes(): GraphNode[];
        getRemovedEdges(): GraphEdge[];
        selection: SelectionManager;
        toggleSelfLinks(nodeId: string): any;
        entitiesAddedOrRemoved(): boolean;
        addModelTransformFunction(transformFunction: GraphModelTransformFunction): void;
        addModelChangeHandler(query: any, handler: GraphModelChangeHandler): void;
        addProgressHandler(callback: (progressInfo: GraphModelProgressInfo) => void): void;
        getNodeByDomId(id: string, includeRemoved?: boolean): GraphNode;
        getEdgeByDomId(id: string, includeRemoved?: boolean): GraphEdge;
        getFocusedEntity(includeRemoved?: boolean): AbstractGraphEntity;
    }
    interface GraphModelTransformFunction {
        (model: GraphModel): void;
    }
    interface GraphModelChangeHandler {
        (model: GraphModel): void;
    }
    interface GraphModelProgressInfo {
        incremental: boolean;
        progressState: ProgressState;
    }
    interface GraphModelProgressCallback {
        (progressInfo: GraphModelProgressInfo): void;
    }
    /**
     * Graph view model.
     *
     * To update the model:
     *  1. optionally clear the model before updating it
     *  2. update the model by adding/removing nodes & edges, and by updating their properties. You can also change selection!
     *  3. call notify()
     *
     * Conceptually, notify produces a change event containing a subtree of changed entities and values.
     *
     * For a cleared model, the event is everything in the model, so it isn't required.
     * For an existing model, the event communicates everything that has changed.
     *
     * Events can be aggregated into a separate change model.
     *
     * The current implementation uses sets of change keys on nodes and edges instead of a separate event tree.
     */
    class DefaultGraphModel implements GraphModel {
        /** The graph model is the root of the model tree. Its only CRUD state is 'updated'. */
        updated: boolean;
        private _nodes;
        private childNodeMap;
        private childNodeMapIsStale;
        private _edges;
        selection: SelectionManager;
        adjacencyEmphasis: AdjacencyEmphasis;
        /** If true, reduce opacity of all graph entities except the ones selected and the ones in its upstream and downstream */
        enableAdjacencyEmphasis: boolean;
        private layoutService;
        nodeOrderer: NodeOrderer;
        /** The strategy defining how edges connect to nodes and how they follow the nodes' moves. Default is EdgeConnectionStrategy.NodeCenter. */
        edgeConnectionStrategy: EdgeConnectionStrategy;
        currentExpansionLevel: number;
        private _wasCleared;
        private transformFunctions;
        private changeHandlers;
        private progressHandlers;
        constructor();
        dispose(): void;
        addNode(id: string, properties?: Object): GraphNode;
        updateNodeProperties(id: string, properties: Object): boolean;
        createNodeHierarchy(): void;
        getNode(id: string, includeRemoved?: boolean): GraphNode;
        getNodeByDomId(domId: string, includeRemoved?: boolean): GraphNode;
        getEdgeByDomId(domId: string, includeRemoved?: boolean): GraphEdge;
        getFocusedEntity(includeRemoved?: boolean): AbstractGraphEntity;
        getNodes(): GraphNode[];
        getRemovedNodes(): GraphNode[];
        getChildNodes(parentNode: GraphNode): GraphNode[];
        removeNode(id: string): void;
        getEntities(): GraphEntity[];
        /**
         * Return true if create or update was successful, false if something went wrong.
         * @param id
         * @param props
         */
        addEdge(sourceId: string, destinationId: string, sourceNode: GraphNode, destNode: GraphNode, props: PropertyMap): GraphEdge;
        /**
         * Used internally to implement edges for collapsed nodes.
         */
        protected _addAggregateEdge(source: string, dest: string, edge: GraphEdge): GraphEdge;
        getEdge(id: string): GraphEdge;
        getEdge(source: string, destination: string): GraphEdge;
        getEdges(): GraphEdge[];
        getRemovedEdges(): GraphEdge[];
        removeEdge(id: string): void;
        /**
         * Returns true if node(s) or edge(s) were added or removed from the model
         */
        entitiesAddedOrRemoved(): boolean;
        nodesAddedOrRemoved(): boolean;
        edgesAddedOrRemoved(): boolean;
        /**
         * Clear the model.
         * @param forceClear false: mark enties as removed and use diffing, true: remove entities
         */
        clear(forceClear?: boolean): void;
        getSourceNode(edge: GraphEdge): GraphNode;
        getDestinationNode(edge: GraphEdge): GraphNode;
        toggleSelfLinks(nodeId: string): void;
        isSelfLink(edge: GraphEdge): boolean;
        getInboundEdges(node: GraphNode): GraphEdge[];
        addModelTransformFunction(callback: GraphModelTransformFunction): void;
        addModelChangeHandler(query: any, callback: GraphModelChangeHandler): void;
        addProgressHandler(callback: (progressInfo: GraphModelProgressInfo) => void): void;
        /**
         * Call notify when finished changing the model to notify views.
         */
        notify(): void;
        private notifyProgress(progressState);
        private updateDerivedProperties();
        private reconcileState();
        isLayoutNeeded(): boolean;
        protected updateAggregateEdges(): void;
        private getAbstractGraphEntityByDomId(domId, entities, includeRemoved?);
        private isNodeInLayout(node);
        private clearEventState();
        setLayoutService(layoutService: Layout.ILayoutManager): void;
        setNodeOrderer(nodeOrderer: NodeOrderer): void;
        doLayout(layoutMode: Layout.LayoutUpdatePattern): Layout.LayoutGraph;
        computeLayout(layoutMode: Layout.LayoutUpdatePattern): Layout.LayoutGraph;
        applyLayout(layout: Layout.LayoutGraph): void;
        private segmentsChanged(oldSegments, newSegments);
        private connectEdgeToSourcePort(viewEdge, layoutSourceEdgePort);
        private connectEdgeToDestPort(viewEdge, layoutDestEdgePort);
        private getSourcePortLocationFromLayout(layoutPort);
        private getDestPortLocationFromLayout(layoutPort);
        private clearPortConnected(node);
        private updatePortLocations(node);
        /**
         * Adds curved segment to edges. Looks better than hard corners and makes individual edge routing clearer.
         */
        calcSegments(layoutEdgeSegments: number[][]): EdgeSegment[];
    }
}


declare module HyperGraph {
    interface TreeNode {
        /**
         * Parent node id. All nodes can contain child nodes and can support expansion.
         * Its size is determined by bounding rect of its child nodes + padding + border + margins.
         */
        parentId: string;
        expanded: boolean;
        level: number;
    }
    class GraphNode extends AbstractGraphEntity implements TreeNode {
        /** A node can have up to 12 ports, 3 on each side. Similar to Visio connection point conventions. */
        ports: Dictionary<GraphNodePort>;
        private _childNodes;
        constructor(id: string, properties?: PropertyMap);
        protected setDefaultValues(): void;
        dispose(): void;
        protected createPorts(): void;
        /** primary label displayed on the node */
        displayName: string;
        /** The absolute X,Y coordinates of the node on the stage (formerly "committedX") */
        x: number;
        y: number;
        width: number;
        height: number;
        parentId: string;
        rootId: string;
        level: number;
        expanded: boolean;
        alwaysExpanded: boolean;
        selfLinksVisible: boolean;
        unconnectedNodesVisible: boolean;
        numberOfInboundConnections: number;
        numberOfOutboundConnections: number;
        numberOfInboundSelfConnections: number;
        numberOfOutboundSelfConnections: number;
        segregateConnectedNodes: boolean;
        precomputeNodeWidth: boolean;
        filterChanged: boolean;
        semanticZoomChange: boolean;
        isHovered: boolean;
        /** Entity bounding rect */
        getBounds(): IRect;
        addChildNode(node: GraphNode): void;
        removeChildNode(node: GraphNode): void;
        getChildNodes(): Array<GraphNode>;
        getLeftEdge(): GraphEdge;
        getRightEdge(): GraphEdge;
        getLeftEdges(): GraphEdge[];
        getRightEdges(): GraphEdge[];
    }
}

declare module HyperGraph {
    interface GraphWidgetPort {
        Width: number;
        Height: number;
    }
    const enum PortLocation {
        Center = 0,
        Top1 = 1,
        Top2 = 2,
        Top3 = 3,
        Right1 = 4,
        Right2 = 5,
        Right3 = 6,
        Bottom1 = 7,
        Bottom2 = 8,
        Bottom3 = 9,
        Left1 = 10,
        Left2 = 11,
        Left3 = 12,
    }
    const enum PortConnectedDirection {
        None = 0,
        Inbound = 1,
        Outbound = 2,
        Both = 3,
    }
    /**
     * Defines edge connection points/anchors/ports.
     */
    class GraphNodePort extends AbstractEntity {
        location: PortLocation;
        /**
         * Creates a graph node port view model.
         * @param graphPort The port this view model wraps around.
         */
        constructor(id: string, location: PortLocation);
        setDefaultValues(): void;
        /** The X,Y coordinates of the port relative to the node (formerly "hostRelativeX/Y") */
        x: number;
        y: number;
        /** true: has at least one edge connected */
        connected: PortConnectedDirection;
        dispose(): void;
    }
}

declare module HyperGraph {
    class SelectedEntities {
        selectedNodeIds: string[];
        selectedEdgeIds: string[];
        constructor(selectedNodeIds?: string[], selectedEdgeIds?: string[]);
    }
    /**
     * This class maps the entity selection property to selection set membership.
     * It uses the GraphModel interface because selection follows tree model conventions.
     */
    class SelectionManager implements IGraphModel<GraphNode, GraphEdge> {
        graphModel: GraphModel;
        focusedEntityId: string;
        focusedEntity: AbstractGraphEntity;
        currentExpansionLevel: number;
        constructor(graphModel: DefaultGraphModel);
        dispose(): void;
        /**
         * Toggles an entity's selection state.
         *
         * @param entityViewModel the entity to toggle selection state
         */
        toggleEntitySelection(selectableEntity: GraphEntity): void;
        /**
         * Selects an entity, clearing previous selection.
         */
        selectEntity(selectableEntity: GraphEntity, clearSelection?: boolean): void;
        /**
         * Deselects the given entity.
         *
         * @param entityViewModel The entity to deselect.
         */
        deselectEntity(selectableEntity: GraphEntity): void;
        /**
         * Returns true if node was added to the selection (i.e. selection has changed)
         * @param nodeId
         */
        addNode(nodeId: string): GraphNode;
        _addNode(node: GraphNode): GraphNode;
        addEdge(edgeId: string): GraphEdge;
        _addEdge(edge: GraphEdge): GraphEdge;
        getNode(id: string): GraphNode;
        getFocusedEntity(): AbstractGraphEntity;
        getChildNodes(parentNode: GraphNode): GraphNode[];
        createNodeHierarchy(): void;
        getEdge(id: string): GraphEdge;
        updateNodeProperties(id: string, properties: Object): boolean;
        getSourceNode(edge: GraphEdge): GraphNode;
        getDestinationNode(edge: GraphEdge): GraphNode;
        removeNode(nodeId: string): boolean;
        removeEdge(edgeId: string): boolean;
        /**
         * Selects all graph nodes and edges.
         */
        selectAllEntities(): void;
        /**
         * Removes all items from the selection.
         */
        clear(): void;
        getNodes(): GraphNode[];
        getNodeIds(): string[];
        getEdges(): GraphEdge[];
        getEdgeIds(): string[];
        getSelectedEntityCount(): number;
        getNodeCount(): number;
        getEdgeCount(): number;
        /**
         * Return true if entity added or removed from the selection set.
         * (The underlying implementation checks the selected property on entities, but
         * entity attribute and containment map to each other.)
         */
        entitiesAddedOrRemoved(): boolean;
        notify(): void;
    }
}


declare module HyperGraph {
    /** The function used to get the current time. Tests can inject their own method and control time in a more rigorous manner. */
    var getCurrentTime: () => number;
    /** The function used to call a function after a certain amount of time. Tests can inject their own method to control time. */
    var setTimeoutFromCurrentTime: (handler: any, timeout?: number) => number;
    /** A dictionary of all the animating properties. The key is the property being animated and the value is the current tween. */
    interface IAnimationState {
        [key: string]: number;
    }
    /**
     * A dictionary of properties to animate. Each property is defined by numeric start and end values.
     * Note: end should be either <number> or <KnockourObservable<Number>>.
     */
    interface IAnimationDescriptor {
        [key: string]: {
            start: number;
            end: any;
        };
    }
    class Animation {
        /**
         * A polyfill for requestAnimationFrame
         */
        static _requestAnimationFramePolyfill: (callback: () => void) => number;
        static readonly requestAnimationFramePolyfill: (callback: () => void) => number;
        static _cancelAnimationFramePolyfill: (id: number) => void;
        static readonly cancelAnimationFramePolyfill: (id: number) => void;
        /**
         * A subscribable that notifies subscribers when the animation is explicitly stopped or finishes naturally.
         */
        animationEnded: IAnimationState;
        private _duration;
        private _easingFunction;
        private _stepFunction;
        private _startTime;
        private _endTime;
        private _animatedProperties;
        private _animationStopped;
        private _ignoreFrames;
        /**
         * Creates an animation that tweens some collection of values between start and end values.
         *
         * @param stepFunction callback for every frame of the animation
         * @param animatedProperties a dictionary where the key is the name of the animated property and its value contains the start and end values.
         * @param duration the length of the animation in milliseconds
         * @param easingFunction a Callback that maps time to percentage complete for the animation.
         */
        constructor(stepFunction: (currentAnimationState: IAnimationState) => void, animatedProperties: IAnimationDescriptor, duration?: number, easingFunction?: (percentComplete: number) => number);
        private static _defaultEasing(percentTime);
        /**
         * Starts the animation.
         */
        start(): void;
        /**
         * Stops the animation
         */
        stop(): void;
        /**
         * Whether the animation is stopped (explicitly or the animation ended).
         */
        readonly animationStopped: boolean;
        private _step();
    }
}

declare module HyperGraph {
    interface StringMap<T> {
        [key: string]: T;
    }
    interface IMutableDictionary<T> {
        put(key: string, value: T): void;
        lookup(key: string): T;
        forEach(callback: (value: T, key: string) => any, thisArg?: any): void;
        forEachReverse(callback: (value: T, key: string) => any, thisArg?: any): void;
        modify(callback: () => void): void;
        toArray(): Array<T>;
        remove(key: string): void;
        clear(): void;
        dispose(): any;
    }
    /**
     * Hash map. Replaces ObservableMap.
     */
    class Dictionary<T> implements IMutableDictionary<T> {
        protected _map: {};
        constructor(initialProperties?: Object);
        dispose(): void;
        put(key: string, value: T): void;
        lookup(key: string): T;
        clear(): void;
        forEach(callback: (value: T, key: string) => any, thisArg?: any): void;
        forEachReverse(callback: (value: T, key: string) => any, thisArg?: any): void;
        modify(callback: () => void): void;
        getKeys(): string[];
        toArray(): Array<T>;
        remove(key: string): void;
        readonly size: number;
        /**  get values as a raw javascript object */
        getValues(): Object;
        clone(): Dictionary<T>;
        assignFrom(dictionary: Dictionary<T>): void;
        protected static _copyObjectToDictionary(from: Object, to: any): void;
        /**
         * Populates the view model from a key/value pairs object.
         * The keys should map to properties on the view model.
         * The values are applied to the corresponding keys.
         *
         * @param object An un-typed object with values to populate on the view model.
         */
        populateFromObject(object: Object): void;
        /**
         * Deep copies all the properties of the source object to the destination object.
         * All properties in destination that are not in the source should remain intact.
         * Functions are copied by reference.
         *
         * @param source The object whose properties need to be copied.
         * @param destination The destination object.
         */
        static copyObject(source: Object, destination: any): void;
    }
    /**
     * Shallow copy from a key/value pairs object.
     *
     * @param to An un-typed object to be populated.
     * @param from An un-typed object with values to populate.
     * @param scopes Scoped down the list for shallowCopy
     */
    function shallowCopyFromObject(to: Object, from: Object, scopes?: string[]): void;
    /**
       * Deep copies all the properties of the source object to the destination object.
       * All properties in destination that are not in the source should remain intact.
       * Functions are copied by reference.
       *
       * We need to ensure that properties that point to one of their ancestors doesn't cause a infinite loop.
       * To that end, we pass in the sourceAncestors and destination ancestors and check against that.
       *
       * @param source The object whose properties need to be copied.
       * @param destination The destination object.
       * @param sourceAncestors The ancestors of the source object used to prevent circular linked list causing an infinite loop.
       * @param destinationAncestors The ancestors of the destination object corresponding to the sourceAncestors to assign to circular linked list.
       */
    function _copyObject(source: Object, destination: any, sourceAncestors: Object[], destinationAncestors: Object[]): void;
    class StringSet extends Dictionary<string> {
        constructor();
        add(key: string): void;
        dispose(): void;
    }
}


declare module HyperGraph {
    interface IPoint {
        /** The x coordinate of the point. */
        x: number;
        /** The y coordinate of the point. */
        y: number;
    }
    interface IRect {
        /** The x coordinate of the rectangle. */
        x: number;
        /** The y coordinate of the rectangle. */
        y: number;
        /** The height of the rectangle. */
        height: number;
        /** The width of the rectangle. */
        width: number;
    }
    /**
     * Returns whether or not a completely lies in b
     *
     * @param a the rect to test for lying in b
     * @param b the enclosing rect
     * @return true if a lies completely in b. false otherwise.
     */
    function rectLiesInRect(a: IRect, b: IRect): boolean;
    /**
     * Returns the first point where the ray starting at p1 and ending at p2 intersects rect.
     *
     * @param p1 the start point for the line to test
     * @param p2 the end point for the line to test
     * @param rect the rectangle
     * @param rectPadding padding around the rectangle to make the ray float a bit off it
     * @return where the line and rectangle intersect on the exterior of the rectangle or null if they don't
     */
    function rayRectIntersection(p1: IPoint, p2: IPoint, rect: IRect, rectPadding?: number): IPoint;
}

declare module HyperGraph {
    function uncurryThis(f: (...args: any[]) => any): (...args: any[]) => any;
    const applyUncurry: (f: (...args: any[]) => any, target: any, args: any[]) => any;
    /** Returns a rfc4122 style UUID v4 GUID such as xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx. */
    function newGuid(): string;
    /** Returns a function that can generate globally unique identifiers. */
    function getUniqueIdGenerator(prefix?: string): () => string;
    /** Returns a function that can generate unique id under the prefix */
    function getIdGenerator(prefix: string): () => string;
    /** Returns a globally unique identifier string. */
    const getUniqueId: () => string;
    /** Replaces all instances of a value in a string. */
    function replaceAll(input: string, searchValue: string, replaceValue: string): string;
    /** Escapes regular expression special characters -[]/{}()*+?.\^$| */
    function regexEscape(str: string): string;
}

declare module HyperGraph {
    /**
     * Uses an array to maintain ordering. Needed for edge path highlighting.
     */
    class OrderedDictionary<T> extends Dictionary<T> {
        keys: any[];
        constructor(initialProperties?: Object);
        put(key: string, value: T): void;
        clear(): void;
        getKeys(): string[];
        toArray(): Array<T>;
        forEach(callback: (value: T, key: string) => any, thisArg?: any): void;
        forEachReverse(callback: (value: T, key: string) => any, thisArg?: any): void;
        remove(key: string): void;
        readonly size: number;
        clone(): OrderedDictionary<T>;
        populateFromObject(object: Object): void;
    }
}


declare module HyperGraph {
    /**
     *
     */
    class PropertyMap extends Dictionary<Object> {
        constructor(initialProperties?: Object);
        isEmpty(): boolean;
        updateProperties(properties: PropertyMap): PropertyMap;
        merge(propMap: PropertyMap): PropertyMap;
    }
}

declare module HyperGraph {
    function forEachKey<T>(obj: any, iterator: (key: any, value: T) => void): void;
    class Timers {
        /**
         * Setup the timers to use the built-in browser timers or the setTimeout version.
         * This function should only be invoked before any timers have been set up.
         *
         * @param forceUseSetTimeout Determines which timer to use.
         */
        static setupTimers(forceUseSetTimeout?: boolean): void;
        /**
         * Sets a one-time callback to be fired at the next frame refresh.
         *
         * @param callback The function to be called when the frame is refreshed.
         * @return A handle to the timeout which can be cancelled.
         */
        static requestAnimationFrame(callback: FrameRequestCallback): number;
        /**
         * Cancels a timeout that was set with requestAnimationFrame.
         *
         * @param handle A handle to the callback.
         */
        static cancelAnimationFrame(handle: number): void;
        /**
         * Sets a recurring callback to be fired at every subsequent frame refresh.
         *
         * @param callback The function to be called every time the frame is refreshed.
         * @return A handle to the callback which can be cancelled.
         */
        static requestAnimationFrameInterval(callback: FrameRequestCallback): number;
        /**
         * Cancels a recurring callback that was set with requestAnimationFrameInterval.
         *
         * @param handle A handle to the callback.
         */
        static cancelAnimationFrameInterval(handle: number): void;
        static executeAnimationFrameInterval(time: number): void;
        static scheduleAnimationFrameInterval(force: boolean): void;
        static clearAnimationFrameInterval(): void;
    }
}

declare module HyperGraph {
    interface Action {
        (): void;
    }
    /**
     * An object that is disposable.
     */
    interface Disposable {
        /**
         * A function called on the object when it is disposed.
         */
        dispose(): void;
    }
    type ActionOrDisposable = Action | Disposable;
    interface RegisterForDisposeFunction {
        (disposables: ActionOrDisposable[]): LifetimeManagerBase;
        (disposable: ActionOrDisposable): LifetimeManagerBase;
    }
    /**
     * An object that can limit the lifetime of other objects. When a LifetimeManager object
     * is disposed, it will dispose all other objects that were registered for disposal.
     */
    interface LifetimeManagerBase {
        /**
         * Registers an object to be disposed.  It will throw if the object doesn't have dispose method.
         * @param disposable An object to be disposed once the LifetimeManager object itself is disposed.
         */
        registerForDispose: RegisterForDisposeFunction;
    }
    interface LifetimeManager extends LifetimeManagerBase {
        /**
         * Create a createChildLifetime to localize the LifetimeManager.
         * It will provide the function on tracking who create it and when it dispose, it will remove itself from Container's lifetimeManager
         */
        createChildLifetime(): DisposableLifetimeManager;
    }
    interface DisposableLifetimeManager extends Disposable, LifetimeManager {
        /** A value indicating whether or not the lifetime is disposed. */
        isDisposed(): boolean;
    }
    /**
     * An object that tracks and invokes disposal callbacks. This can be used
     * in other classes that wish to implement LifetimeManager.
     */
    class TriggerableLifetimeManager implements DisposableLifetimeManager {
        private _disposables;
        private _isDisposed;
        private _isDisposing;
        private _container;
        private _children;
        private _failToDispose;
        private _diagnosticCreateStack;
        constructor();
        /**
         * Gets a value indicating whether or not the lifetime is disposed.
         */
        isDisposed(): boolean;
        /**
         * See interface.
         */
        registerForDispose: RegisterForDisposeFunction;
        /**
         * See interface.
         */
        createChildLifetime(): DisposableLifetimeManager;
        /**
         * Causes the instance to regard itself as disposed, and to trigger any
         * callbacks that were already registered.
         */
        dispose(): void;
        _unregisterChildForDispose(disposable: Disposable): void;
        _isRegistered(disposable: Disposable): boolean;
        _registerForDispose(disposable: Disposable): void;
    }
}

declare module HyperGraph {
    function assert(expression: any, err?: string): void;
    class Log {
        static enableLogging: boolean;
        static error(msg: string): void;
        static warn(msg: string): void;
        static debug(msg: string): void;
        private static getTime();
    }
    class BrowserUtils {
        private static _isEdge;
        static isEdge(): boolean;
    }
    class EventUtils {
        private static _eventNames;
        static isValidEvent(eventName: string): boolean;
    }
    class Utils {
        private static readonly MIN_DOM_ID_LENGTH;
        /**
         * Correctly extract out ID from document element's domId, for example
         * a domId typically has the part name prepended to it like "<part>-<guid>-<int>"
         * so this will filter out the <part> so it will return "<guid>-<int>" which can
         * then be mapped to the internal graph model
         *
         * @param domId
         */
        static ParseDomId(domId: string): string;
        /**
         * Extract out part name from domId. Verifies the part has three
         * hyphens or else it will return `undefined`
         *
         * @param domId
         */
        static ParseDomPartName(domId: string): string;
    }
}


/// <reference types="d3" />
declare module HyperGraph {
    /**
     * A layer holds graph elements. A graph stage can have 1..n layers.
     */
    class AbstractGraphStageLayer {
        stage: GraphStage;
        layerName: string;
        constructor(graphStage: GraphStage, layerName: string);
        attach(svgContainer: d3.Selection<any>): void;
        clear(): void;
    }
    type LayerName = "edges" | "parentNodes" | "childNodes" | "selectedNodes";
    type RendererName = "node" | "edge";
    /**
     * This is a pure SVG implementation with a single SVG element holding
     * all node and edge shapes.
     */
    abstract class AbstractStage implements GraphStage {
        private layers;
        private renderers;
        /** How zoomed in the user is. */
        scale: number;
        graphStageAnimation: GraphStageAnimation;
        /**
         * Computes the new scale sooming in by steps number of steps (which can be negative for zoom out).
         * This computed scale is relative to the current scale.
         *
         * @param steps the number of steps to zoom in our out. In is positive, out is negative.
         * @return the new scale that will result from zooming in or out.
         */
        static calculateNewZoom(steps: number, scale: number): number;
        constructor();
        dispose(): void;
        abstract preRender(): any;
        abstract postRender(): any;
        addRenderer(rendererName: string, renderer: DomRenderer): void;
        getRenderer(rendererName: string): DomRenderer;
        addLayer(layerName: LayerName): GraphStageLayer;
        getLayer(layerName: LayerName): GraphStageLayer;
        removeLayer(layerName: LayerName): void;
        saveNodePosition(node: GraphNode): NodePosition;
        restoreNodePosition(node: GraphNode, oldNodePosition: NodePosition): void;
        abstract clear(): any;
        /** Called on attach to dom */
        abstract attach(container: any): any;
        abstract addEntity(graphEntity: GraphEntity, topmost: boolean): any;
        abstract removeEntity(entity: GraphEntity): boolean;
        abstract findEntityByDomId(domId: string): GraphEntity;
        abstract clientToDomainCoordinates(clientPoint: IPoint): IPoint;
        abstract bringRectIntoView(rect: IRect, animate?: boolean): any;
        abstract zoomIn(steps?: number): any;
        abstract zoomOut(steps?: number): any;
        abstract zoomTo100Percent(): any;
        abstract zoomToFit(): any;
        abstract handleMouseWheelZoom(wheelUnits: number, clientX: number, clientY: number): void;
        abstract setWaitCursor(boolean: any): any;
        abstract pan(clientDx: number, clientDy: number): void;
        abstract panWithFeedback(clientDx: number, clientDy: number): void;
        abstract maxFeedbackDistance(): number;
        abstract feedbackShowing(): boolean;
        abstract updateScrollbars(): any;
    }
}

/// <reference types="d3" />
declare module HyperGraph {
    class DefaultEdgeRenderer extends DomRenderer {
        stage: GraphStageDom;
        constructor(layer: GraphStageLayer);
        addContainerToDom(edge: GraphEdge, svgContainer: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
        renderToDom(edge: GraphEdge, edgeContainer: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
        getArrowheadTransform(edge: GraphEdge): string;
        protected getLineDisplayClasses(edge: GraphEdge): string;
        protected getFillDisplayClasses(edge: GraphEdge): string;
    }
}

/// <reference types="d3" />
declare module HyperGraph {
    class DefaultNodeRenderer extends DomRenderer {
        constructor(layer: HyperGraph.GraphStageLayer);
        protected observeEntityProperties(): void;
        addContainerToDom(node: GraphNode, svgContainer: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
        addChildContainerToDom(node: GraphNode, childDomId: string, svgContainer: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
        protected renderSelectionRectangle(node: GraphNode): void;
        renderToDom(node: GraphNode, nodeGroup: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
    }
}

/// <reference types="d3" />
declare module HyperGraph {
    interface GraphEntityRenderer {
        renderToDom(entity: PropertyEntity, svgContainer: d3.Selection<any>): d3.Selection<any>;
    }
    /**
     * Base DOM renderer. One renderer instance is shared by all nodes.
     */
    abstract class DomRenderer implements GraphEntityRenderer {
        /** set this in constructor */
        layer: GraphStageLayer;
        childRenderers: DomRenderer[];
        private _parent;
        private _observedProperties;
        constructor(layer: GraphStageLayer);
        /**
         * Renders the entity to the DOM. This implementation relies on containers to
         * manage the upsert behavior. When an entity is first added to the DOM,
         * an entity container is created. From that point on the container is emptied and
         * repopulated on a render. Child elements use the same convention for
         * efficient updating.
         *
         * @param entity
         * @param svgContainer
         */
        addChildRenderers(childRenderers: DomRenderer[]): void;
        observe(props: string[]): void;
        isChanged(entity: PropertyEntity): boolean;
        _isChanged(changeKeys: string[]): boolean;
        /** Override this for child renderers. */
        getContainerId(entity: GraphEntity): string;
        /**
         *  hook for renderers to add svg defs when stage is attached
         */
        attach(): void;
        protected renderErrorEntity(entity: any, svgContainer: d3.Selection<any>): void;
        /**
         * Template method to ensure that child elements are added to the stage svgElements map.
         */
        /**
         * Create the entity container in the DOM.
         * @param entity
         * @param svgContainer
         */
        addContainerToDom(entity: GraphEntity, svgContainer: d3.Selection<any>): d3.Selection<any>;
        addChildContainerToDom(node: GraphNode, childDomId: string, svgContainer: d3.Selection<any>): d3.Selection<any>;
        /**
         * Update/render the entity to the entity's DOM container.
         * @param entity
         * @param svgContainer
         */
        renderToDom(entity: GraphEntity, svgContainer: d3.Selection<any>): d3.Selection<any>;
        protected renderTemplate(entity: any): string;
    }
}

declare module HyperGraph {
    /**
     * Skin styles of the graph editor.
     */
    enum GraphEditorSkinStyle {
        /** Canvas and node background colors are consistent with typical blade and parts background colors. */
        Blade = 0,
        /** Canvas background color is strictly white or black (depending on main color theme), node background color is a tint of blue. */
        Document = 1,
    }
}

/// <reference types="jquery" />
declare module HyperGraph {
    /**
     * Abstraction of the dom/canvas for rendering.
     * The stage holds graphical elements. It can zoom, pan, etc.
     * It doesn't know anything about:
     *   * the graph model
     *   * nodes and edges
     *   * event handling
     */
    interface GraphStage extends Disposable {
        scale: number;
        graphStageAnimation: GraphStageAnimation;
        attach(domElement: JQuery): any;
        preRender(): any;
        postRender(): any;
        getRenderer(name: RendererName): GraphEntityRenderer;
        getLayer(layerName: LayerName): GraphStageLayer;
        addEntity(entity: GraphEntity, topmost: boolean): any;
        removeEntity(entity: GraphEntity): boolean;
        clientToDomainCoordinates(clientPoint: IPoint): IPoint;
        bringRectIntoView(rect: IRect, animate?: boolean): any;
        zoomIn(steps?: number): any;
        zoomOut(steps?: number): any;
        zoomTo100Percent(): any;
        zoomToFit(): any;
        handleMouseWheelZoom(wheelUnits: number, clientX: number, clientY: number): void;
        setWaitCursor(boolean: any): any;
        pan(clientDx: number, clientDy: number): void;
        panWithFeedback(clientDx: number, clientDy: number): void;
        maxFeedbackDistance(): number;
        feedbackShowing(): boolean;
        updateScrollbars(): any;
        clear(): any;
        saveNodePosition(node: GraphNode): NodePosition;
        restoreNodePosition(node: GraphNode, oldNodePosition: NodePosition): void;
        dispose(): any;
    }
}

/// <reference types="q" />
declare module HyperGraph {
    const requestAnimationFramePolyfill: (callback: () => void) => number;
    const cancelAnimationFramePolyfill: (id: number) => void;
    class GraphStageAnimation {
        private stage;
        static _animationToCleanup: string[];
        private _animationFrames;
        private _lastAnimatedScale;
        _inertiaAnimationFrame: number;
        private _currentPanZoomAnimation;
        private _endFeedbackAnimation;
        _mouseMoveAnimationFrame: number;
        _touchMoveAnimationFrame: number;
        _touchZoomAnimationFrame: number;
        constructor(stage: GraphStage);
        dispose(): void;
        /**
        * Animates such that target becomes the top left corner of the control at the specified scale.
        *
        * @param target The point that will become the new top-left corner.
        * @param targetScale The desired scale.
        */
        animateToLocation(target: IPoint, targetScale?: number): Q.Promise<any>;
        /**
         * Animates after feedback is finished.
         * @param callback Optional function to be called once feedback has animated back into place.
         */
        animateEndFeedback(callback?: () => void): void;
        runAnimation(name: string, animationCallback: () => void, count?: number): boolean;
        stopAnimation(name: string): void;
        animationTest(): void;
    }
}

/// <reference types="d3" />
/// <reference types="jquery" />
/// <reference types="q" />
declare module HyperGraph {
    const enum DomUpdatePattern {
        /** DOM is cleared and re-rendered */
        Rebuild = 1,
        /** Only changed entities are rendered */
        Incremental = 2,
    }
    /**
     * The size of scrollbars given Browser, styling, etc.
     */
    interface IScrollBarSize {
        /** The width of vertical scrollbars. */
        vertical: number;
        /** The height of horizontal scrollbars. */
        horizontal: number;
    }
    /** For saving node position on node expansion */
    interface NodePosition {
        oldExpansionNodeX: number;
        oldExpansionNodeWidth: number;
        oldExpansionNodeY: number;
    }
    /** How much to zoom and around what point. */
    interface IZoomInfo {
        /** The scale in the zoom operation. */
        scale: number;
        /** The point about which to zoom. */
        location: IPoint;
    }
    enum GraphScrollBars {
        None = 0,
        Horizontal = 1,
        Vertical = 2,
    }
    enum GraphScrollBarsVisibilityMode {
        /** Scroll-bars are always visible when mouse pointer is on the graph canvas. */
        AlwaysVisible = 0,
        /** Scroll-bars are hidden. */
        AlwaysHidden = 1,
        /** Scroll-bars are only visible when nodes are outside the viewport. */
        AppearWhenNodesOutsideOfTheView = 2,
    }
    interface RenderStatus {
        created: number;
        updated: number;
        child: number;
    }
    /**
     * D3js layer implementation that uses pure SVG renderers.
     */
    class GraphStageLayer extends AbstractGraphStageLayer {
        svgContainer: d3.Selection<any>;
        constructor(graphStage: GraphStage, layerName: string);
        attach(svgContainer: d3.Selection<any>): void;
        clear(): void;
    }
    const RENDERER_NODE: string;
    const RENDERER_EDGE: string;
    /**
     * DOM-based implementation of graph stage.
     * This is an all-SVG implementation with a single SVG element
     * containing all node and edge shapes in one or more layers.
     */
    class GraphStageDom extends AbstractStage {
        private static scrollBarSizes;
        $element: JQuery;
        $graphContainer: JQuery;
        $entityEventContainer: JQuery;
        svg: d3.Selection<any>;
        svgDefs: d3.Selection<any>;
        layerContainer: d3.Selection<any>;
        domIdToNodeMap: Dictionary<GraphEntity>;
        domIdToSvgContainerMap: Dictionary<d3.Selection<any>>;
        domUpdateMode: DomUpdatePattern;
        x: number;
        y: number;
        /** Padding (in pixels) around the graph bounds when zoomToFit is called. Takes effect for zoomToFit() calls made AFTER zoomToFitPadding observable value change. Default value is 100. */
        zoomToFitPadding: number;
        zoomThresholdChange: boolean;
        private _matrixTransform;
        private _scrollBarSizes;
        private _viewUpdatingHorizontalScrollbar;
        private _viewUpdatingVerticalScrollbar;
        private _lastContainerWidth;
        private _lastContainerHeight;
        private _suggestedScrollBars;
        /** The set of the scrollbars enabled for the graph instance. Make sure to initialize .scrollBarsVisibilityMode property as needed as well. */
        scrollBars: number;
        /** The mode of the scroll-bars appearance. Make sure to initialize .scrollBars property as needed as well. */
        scrollBarsVisibilityMode: GraphScrollBarsVisibilityMode;
        _oLeft: number;
        _oRight: number;
        _oBottom: number;
        _oTop: number;
        /** Currently choosen graph style skin. */
        styleSkin: GraphEditorSkinStyle;
        private _isDisposed;
        constructor(styleSkin?: GraphEditorSkinStyle);
        /**
         * Disposes the widget.
         */
        dispose(): void;
        /** Indicates if the stage has been disposed. */
        isDisposed(): boolean;
        /**
         * Called on attach to dom
         * @param container
         */
        attach($domElement: JQuery): void;
        preRender(): void;
        postRender(): void;
        clear(): void;
        addLayer(layerName: LayerName): GraphStageLayer;
        removeLayer(layerName: LayerName): void;
        getLayerKey(entity: GraphEntity): string;
        getRendererKey(entity: GraphEntity): string;
        /**
         * Upserts an entity to the graph stage.
         * In this implementation the entity is rendered to the DOM.
         * @param entity
         */
        addEntity(entity: GraphEntity, topmost: boolean): RenderStatus;
        protected _createEntity(entity: GraphEntity, renderer: DomRenderer): {
            created: number;
            updated: number;
            child: number;
        };
        protected _updateEntity(entity: GraphEntity, renderer: DomRenderer, topmost: boolean): {
            created: number;
            updated: number;
            child: number;
        };
        findEntityByDomId(domId: string): GraphEntity;
        removeEntity(entity: GraphEntity): boolean;
        protected _showHorizontalScrollBar(): boolean;
        protected _showVerticalScrollBar(): boolean;
        protected _horizontalScrollBarClasses(): string;
        protected _verticalScrollBarClasses(): string;
        /**
         * Checks whether the specified scrollBar is enabled for the view model.
         * @param scrollBar The scrollBar to check on.
         * @return True if the scrollBar is enabled, false othervise.
         */
        scrollBarEnabled(scrollBar: GraphScrollBars): boolean;
        /**
         * Checks whether the scrollBars visibility mode is set to AlwaysVisible for the view model.
         * @return True if the mode is equal to AlwaysVisible, false othervise.
         */
        scrollBarsAlwaysVisible(): boolean;
        /**
         * Checks whether the scrollBars visibility mode is set to AppearWhenNodesOutsideOfTheView for the view model.
         * @return True if the mode is equal to AppearWhenNodesOutsideOfTheView, false othervise.
         */
        scrollBarsVisibleWhenNeeded(): boolean;
        readonly _classes: string;
        setWaitCursor(value: boolean): void;
        /**
         * Returns the dimensions of the graph view in client coordinates.
         * @return The x and y offset on the page as well as the height and width of the view in client coordinates.
         */
        readonly viewDimensions: IRect;
        private _querySelectElement(query);
        /**
         * The root SVG container for the connections.
         */
        private readonly _svgRootElement;
        /**
         * The element containing the SVG scale and pan transforms.
         */
        private readonly _transformElement;
        /**
         * The element containing and transforming the div overlays.
         */
        private readonly _graphOverlay;
        /**
         * Returns the dimensions of the entire experiment in domain coordinates
         */
        private readonly _graphBounds;
        /**
         * Converts user space screen coordinates to graph coordinates.
         *
         * @param clientPoint The point to convert in screen coordinates.
         * @return The input point in graph coordinates.
         */
        clientToDomainCoordinates(clientPoint: IPoint): IPoint;
        zoomIn(steps?: number): void;
        zoomOut(steps?: number): Q.Promise<any>;
        zoomTo100Percent(): Q.Promise<any>;
        /** Zooms to fit the graph in the viewport. */
        zoomToFit(): Q.Promise<any>;
        logScale(): number;
        /** Selects the node and brings it into the view with animation. */
        focusOnNode(id: string): Q.Promise<any>;
        /** Selects the edge and brings it into the view with animation. */
        focusOnEdge(id: string): Q.Promise<any>;
        /**
           * Zooms and pans to at a specified scale centered around a specific point.
           *
           * @param clientDx The amount to pan in the x direction in client-space coordinates.
           * @param clientDy The amount to pan in the y direction in client-space coordinates.
           * @param domainCoords The domain coordinates to zoom about.
           * @param targetScale The scale to zoom to.
           */
        pinchZoom(clientDx: number, clientDy: number, domainCoords: IPoint, targetScale: number): void;
        /**
         * Pans the user's view by some delta in client coordinates.
         *
         * @param clientDx the amount to pan in the x direction in client-space coordinates
         * @param clientDy the amount to pan in the y direction in client-space coordinates
         */
        pan(clientDx: number, clientDy: number): void;
        /**
         * Performs a pan with touch gesture feedback (pan boundary with visible spring).
         *
         * @param clientDx the amount to pan in the x direction in client-space coordinates
         * @param clientDy the amount to pan in the y direction in client-space coordinates
         */
        panWithFeedback(clientDx: number, clientDy: number): void;
        /**
         * Returns the maximum feedback distance from all directions.
         * @return The maximum feedback distance for all directions.
         */
        maxFeedbackDistance(): number;
        /**
         * Returns whether or not any feedback is currently showing.
         * @return true if feedback is currently showing.
         */
        feedbackShowing(): boolean;
        /**
         * Computes the canvas pan limits which are used both for scroll bar elevator sizing and to prevent the user from getting lost while they are panning.
         * These limits are a function of where the user is currently viewing and the bounds of the graph.
         *
         * @param scale The scale for which to get the pan limits.
         * @return The pan limits denoted by the top left corner (x,y) and the panning area (width,height)
         */
        getPanLimits(scale?: number): IRect;
        handleMouseWheelZoom(wheelUnits: number, clientX: number, clientY: number): void;
        /**
        * Zooms in or out about the center of the graph
        *
        * @param steps The number of steps to zoom. Positive zooms in, negative out.
        * @param animate Whether the zoom should be animated or instantaneous.
        */
        private _zoomAboutCenter(steps, animate?);
        /**
         * Zooms to a point given a scale.
         *
         * @param targetScale The scale to be zoomed to.
         * @param domainCoords The point to be zoomed about.
         */
        zoomAboutPoint(targetScale: number, domainCoords: IPoint): void;
        /**
         * Performs a zoom to fit with animation.
         */
        private _zoomToFitWithAnimation();
        /**
        * Brings the desired rectangular region into view. If already in view, this is a no-op.
        * The method attempts to make least amount of translation as well as scaling to get the rect.
        *
        * @param rect the rectangle to bring into view
        * @param   animate Whether or not the rect should be animated into position.
        */
        bringRectIntoView(rect: IRect, animate?: boolean): Q.Promise<any>;
        /**
         * Gets the location of an element in relation to the graph diagram.
         *
         * @param   element A HTML element inside the graph diagram.
         */
        getElementRect(element: HTMLElement): IRect;
        /**
         * Synchronizes the scrollbar positions with the view dimensions and where the user is looking.
         */
        updateScrollbars(): void;
        /**
         * Moved from GraphWidget (2/2017 snapshot)
         * since the implementation changes based on the type of stage.
         *
         * This is our primitive for setting view. The user passes the domainX and Y of the top
         * left corner of the screen they want and the zoom level they want. This should be the only
         * function that writes to the transform matrix.
         *
         * @param domainCoords The desired top left corner of the screen in domain units.
         * @param scale The desired scale.
         */
        _setOriginAndZoom(domainCoords: IPoint, scale?: number): void;
        /**
         * Immediately zooms the control about a point without animation.
         *
         * @param targetScale the desired scale after the zoom operation
         * @param domainCoords the point about which to zoom
         */
        private _zoomWithoutAnimation(targetScale, domainCoords);
        /**
         * Calculates the new top left of the view and scale given a desired scale and point around which to zoom.
         *
         * @param targetScale the desired scale the view should have
         * @param domainCoords the point about which to zoom in or out
         */
        private _zoomToPoint(targetScale, domainCoords);
        /**
        * Moves the touch gesture feedback rectangle for each specified direction in client cordinates
        *
        * @param top Change in feedback from the top in px
        * @param right Change in feedback from the right in px
        * @param bottom Change in feedback from the bottom in px
        * @param left Change in feedback from the left
        */
        private _moveFeedback(top, right, bottom, left);
        /**
        * Sets the touch gesture feedback rectangle in each specified direction in client cordinates
        *
        * @param top Feedback from the top in px
        * @param right Feedback from the right in px
        * @param bottom Feedback from the bottom in px
        * @param left Feedback from the left in px
        */
        _setFeedback(top: number, right: number, bottom: number, left: number): void;
        /**
         * Helper function to help identifying the container with data attribute "data-control".
         *
         * @param elem The current element to start searching.
         * @return The first element that has "data-control" attribute. It can be the element it starts with. If none is found, null is returned.
         */
        static findContainingControl(elem: Element): Element;
        /**
         * Returns the height of horizontal scroll bars and the width of vertical scrollbars (i.e. the invariant dimension).
         *
         * @return horizontal Contains the height of horizontal scrollbars and vertical contains the width of vertical scrollbars.
         */
        private static readonly ScrollBarSizes;
    }
}

/// <reference types="d3" />
/// <reference types="jquery" />
declare module HyperGraph {
    /**
     * The definition of a Graph node skin - set of classes used to define ONLY COLOR-RELATED style properties of the elements.
     */
    interface IGraphSkinDefinition {
        /** Class name representing the skin identity. Used as a CSS class in Graph.less file to style NON-COLOR-RELATED properties of the elements (border width, stroke width, etc). */
        skinMonikerClass: string;
        /** Classes managing colors (background, fill, stroke, etc) applied to the graph canvas. */
        canvasColorClasses: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a graph node. */
        nodeColorClasses: IGraphNodeColorClasses;
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a graph edge. */
        edgeColorClasses: IGraphEdgeColorClasses;
        /** The order and comptatibility the node states are used to apply skin color classes. */
        nodeStatesCompatibility: IStateCompatibilityStrategy;
    }
    /**
    * The definition of a tooltip view. This contains coordinates and width of the tooltipBox
    */
    interface ITooltipPosition {
        x: number;
        y: number;
        width: number;
    }
    class SvgUtils {
        /** Collection of supported graph skins. Use a value of GraphEditorSkinStyle enum as a skin key/index. */
        static GraphSkinsCollection: {
            [skin: number]: IGraphSkinDefinition;
        };
        static elideText(text: string, d3Text: d3.Selection<any>, desiredWidth: number, tooltipPosition?: ITooltipPosition): string;
        static hasClass(target: JQuery, className: string): boolean;
        /**
         * Returns a value for the stroke-dash attribute of a path in respect to the specified edge style.
         *
         * @param style The edge line style selected.
         * @return String value for the dash array used if the style is not a solid line, 'none' otherwise.
         */
        static strokeDashArray(style: EdgePattern): string;
        /**
         * Returns a value for the stroke-width attribute of a path in respect to the specified edge strength.
         *
         * @param strength The edge strength selected.
         * @return Width value.
         */
        static strokeWidth(thickness: number): number;
    }
    /**
     * The classes managing colors (background, fill, border color, stroke color, etc) applied to a graph node.
     */
    interface IGraphNodeColorClasses {
        /** States index. */
        [index: string]: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a graph node at rest. */
        atRest: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a hovered graph node. */
        hovered: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a selected graph node. */
        selected: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a node that has focus. */
        focused: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a graph node that is currently emitting an edge draft as a source node. */
        dragSource: string[];
        /** Classes managing colors (background, fill, border color, stroke color, etc) applied to a graph node that is currently accepting an edge draft as destination node. */
        dragTarget: string[];
    }
    /**
     * The classes managing colors (background, fill, border color, stroke color, etc) applied to a graph edge.
     */
    interface IGraphEdgeColorClasses {
        /** States index. */
        [index: string]: string[];
        /** Classes managing colors (stroke color, etc) applied to a graph edge at rest. */
        atRest: string[];
        /** Classes managing colors (stroke color, etc) applied to a selected graph edge. */
        selected: string[];
    }
    /**
     * The definition of the order and comptatibility the entity states are used to apply skin color classes.
     */
    interface IStateCompatibilityStrategy {
        /** Name of the entity state defined for current strategy step. */
        state: string;
        /** Names of the states that can be applied together with the state defined for current strategy step. */
        compatible?: string[];
        /** Strategy to go with in case current entity state is different from the state defined for current strategy step */
        disjunctive?: IStateCompatibilityStrategy;
    }
    var StateCompatibilityStrategyDefinitions: {
        [name: string]: IStateCompatibilityStrategy;
    };
}


/// <reference types="jquery" />
declare module HyperGraph {
    const contextMenuSelector = ".hypergraph-context-menu";
    const contextMenuNodeTriggerSelector = ".hypergraph-node-context-menu-trigger";
    interface GraphContextMenuRenderer {
        getContextMenuTemplate(event: Event, entities: any[]): any;
    }
    class ContextMenu {
        private graphContextMenuRenderer;
        private eventHandlers;
        private popupManager;
        private targetEntity;
        private hideContextMenuTimer;
        private readonly conextMenuHideDelayInMs;
        private isActive;
        constructor(graphContextMenuRenderer: GraphContextMenuRenderer, eventHandlers?: Object);
        show(evt: MouseEvent, targetEntity: GraphNode, x?: number, y?: number): JQuery;
        hide(delay?: number): void;
        private hideContextMenu();
        private clearContextMenu();
    }
}

declare module HyperGraph {
    var SixtyFPS: number;
    var PanPadding: number;
    var ZoomFactor: number;
    var MinScale: number;
    var MaxScale: number;
    var AnimatedZoomDuration: number;
    var SnapAnimationDuration: number;
    var MoveAnimationDuration: number;
    var EscAnimationDuration: number;
    var UndoAnimationDuration: number;
    var RedoAnimationDuration: number;
    var MinVelocity: number;
    var DoubleTapInterval: number;
    var InertiaFriction: number;
    var FeedbackAnimationDuration: number;
    var MaxFeedbackInertiaDistance: number;
    var FeedbackFriction: number;
    var MinFeedbackIntertiaVelocity: number;
    enum EdgeDirection {
        All = 0,
        Inbound = 1,
        Outbound = 2,
    }
    enum PortSide {
        None = 0,
        Top = 1,
        Left = 2,
        Right = 3,
        Bottom = 4,
    }
    /**
    * What the user's drag intent is.
    */
    enum DraggingMode {
        /** The user is not currently dragging an entity. */
        None = 0,
        /** The user is moving graph nodes. */
        Entities = 1,
        /** The user is creating a connection. */
        Connection = 2,
        /** The user is dragging a selection rectangle. */
        SelectionRect = 3,
    }
    /**
     * Determines the mode for navigating around the graph with the keyboard.
     * Anything greater than 'Focus' traps tabbing. In order to escape keyboard
     * trapping, set the interaction mode to 'Focus' or less.
     */
    enum GraphInteractionMode {
        /**
         * Context is passed to the contents of the node. It is up to
         * the node to manage keyboard input and return focus to the graph.
         */
        NodeEdit = 0,
        /**
         * Context is passed to the edge for editing. It is up to
         * the edge to manage input and return focus to the graph.
         */
        EdgeEdit = 1,
        /**
         * The graph has focus only, and is not set as the current context.
         * NOTE: there is no 'FocusNone' state, since that will never evaluate to true -
         * The graph will never receive keyboard input when it doesn't have focus.
         */
        Focus = 2,
        /**
         * Tab navigates around the nodes in a continuous cycle.
         */
        Navigation = 3,
        /**
         * Tab moves focus around the nodes, allowing them to be added/removed from selection
         */
        MultiSelect = 4,
        /**
         * Tab moves around the edges.
         */
        EdgeSelect = 5,
        /**
         * Tab moves focus around the nodes, to select a child node of the currently selected node.
         */
        EdgeCreate = 6,
    }
}

/// <reference types="jquery" />
declare module HyperGraph {
    /**
     * Identifies the root element for widgets. This should be valid for any stage implementation.
     * When user clicks on element of control, GraphStageDom.findContainingControl() will search for the owning control (with data-control attribute) to set the focus.
     */
    const dataControlAttribute = "data-control";
    /**
     * GraphWidget is a component facade for the graph model, stage, and controllers.
     * It follows some Viva component conventions but does not use Knockout.
     *
     * Public methods on this class are generally safe to use.
     */
    class GraphWidget {
        element: JQuery;
        options: Object;
        lifetimeManager: DisposableLifetimeManager;
        disposablesLifetimeManager: DisposableLifetimeManager;
        graphModel: GraphModel;
        stage: GraphStage;
        domUpdatePattern: DomUpdatePattern;
        controller: Controller;
        contextMenu: ContextMenu;
        /**
         * Creates a new instance of the Widget.
         *
         * @param element The element to apply the widget to.
         * @param options The view model to use, as a strongly typed GraphViewModel.ViewModel instance.
         * @param viewModelType The view model type expected. Used to create a default view model instance if the options param is an un-typed object instance. If null, will use the widget GraphViewModel.ViewModel type.
         */
        constructor(element: JQuery, options?: any);
        protected createModel(): GraphModel;
        protected createStage(): GraphStage;
        protected createControllers(): Controller;
        dispose(): void;
        selectEntity(entity: GraphEntity): void;
        toggleExpanded(node: GraphNode): void;
        setNodeExpanded(node: GraphNode, expanded: boolean): void;
        /**
         * Expand or collapse all nodes.
         * @param expand true to expand, false to collapse
         */
        setAllNodesExpansion(isExpanded: boolean): void;
        toggleSelfLinks(nodeId: string): void;
        zoomIn(steps?: number): void;
        zoomOut(steps?: number): void;
        zoomToFit(): void;
        /**
         * Show/hide nodes and/or edges. Edges will hide automatically if you hide
         * the node they are connected to, so in many cases you only need to specify
         * a set of nodes.
         */
        showEntities(entities: GraphEntity[], visible: boolean): void;
        addSelectionChangeHandler(handler: (selection: SelectedEntities) => void): void;
        protected render(): void;
        protected removeEntity(entity: GraphEntity): void;
        protected renderEntity(entity: GraphEntity, topmost: boolean): RenderStatus;
        protected subscribe(query: Object, handler: (data: any) => void): void;
        private _collapseChildeNodes(node);
        private _mapNodeComparator(leftData, rightData);
        /**
         * Adds a subscription to be cleaned up in the dispose().
         * @param disposable One KnockoutComputed to be added to this._disposables.
         */
        private _addDisposablesToCleanUp(disposable);
        /**
         * Adds a list of computed to be cleaned up in the dispose().
         * @param disposable Array of KnockoutComputed to be added to this._disposables.
         */
        private _addDisposablesToCleanUp(disposable);
        readonly _disposables: LifetimeManager;
        addDisposablesToCleanUp: RegisterForDisposeFunction;
    }
}


/// <reference types="jquery" />
declare module HyperGraph {
    class PopupEventManager {
        private closeHandlers;
        private event;
        addCloseHandler(element: JQuery, callback: {
            (): void;
        }): void;
        clear(): void;
        removeCloseHandler(): void;
    }
}

declare module HyperGraph {
    const graphContainerClassName = "hypergraph-container";
    const graphEdgeSvgClassName = "hypergraph-connections-container";
    const graphFeedbackContainerSelector = ".hypergraph-feedback-container";
    const graphOverlaySelector = ".hypergraph-overlay";
    const graphTransformSelector = ".hypergraph-transform";
    const horizontalScrollBarSelector = ".hypergraph-horizontal-scrollbar";
    const verticalScrollBarSelector = ".hypergraph-vertical-scrollbar";
    const horizontalScrollRangeSelector = ".hypergraph-horizontal-scroll-range";
    const verticalScrollRangeSelector = ".hypergraph-vertical-scroll-range";
    var template: string;
}


/**
 * Layout provider interfaces.
 *
 * HyperGraph tells the layout provider about the model then updates the layout.
 * The layout provider returns a layout model with references to nodes and edges in the HyperGraph model.
 */
declare module HyperGraph.Layout {
    class LayoutManager implements ILayoutManager {
        protected nodes: {
            [id: string]: LayoutNode;
        };
        protected edges: {
            [id: string]: LayoutEdge;
        };
        protected nodeStyles: {
            [name: string]: INodeStyle;
        };
        protected newNodes: {
            [id: string]: LayoutNode;
        };
        protected newEdges: {
            [id: string]: LayoutEdge;
        };
        protected yGraph: yfiles.layout.LayoutGraph;
        protected yNodes: {
            [id: string]: yfiles.algorithms.Node;
        };
        protected yEdges: {
            [id: string]: yfiles.algorithms.Edge;
        };
        protected nodeIdMap: yfiles.algorithms.INodeMap;
        protected edgeIdMap: yfiles.algorithms.IEdgeMap;
        protected nodeIdMapForGrouping: yfiles.algorithms.INodeMap;
        protected groupNodesMap: yfiles.algorithms.INodeMap;
        protected parentNodeMap: yfiles.algorithms.INodeMap;
        protected haloMap: yfiles.algorithms.INodeMap;
        protected insetMap: yfiles.algorithms.INodeMap;
        protected rootNodeMap: yfiles.algorithms.INodeMap;
        protected idtoYNodeMap: yfiles.algorithms.IDataMap;
        protected options: LayoutOptions;
        layouter: ILayoutAlgorithm;
        constructor(layouter: ILayoutAlgorithm, options?: LayoutOptions);
        clearGraph(): void;
        isLayoutTypeSupported(layoutUpdatePattern: LayoutUpdatePattern): boolean;
        doLayout(layoutUpdatePattern: LayoutUpdatePattern, suggestedNodeOrder?: NodeOrderMap): LayoutGraph;
        redoEdgeLayout(): LayoutGraph;
        addNode(id: string, parentId: string, rootId: string, expanded: boolean, nodeStyle?: string): LayoutNode;
        addNode(id: string, parentId: string, rootId: string, expanded: boolean, nodeStyle?: INodeStyle): LayoutNode;
        removeNode(id: string): void;
        addEdge(source: string, destination: string): LayoutEdge;
        removeEdge(source: string, destination: string): void;
        getGraph(): LayoutGraph;
        getGraphBoundingBox(): BoundingBox;
        getNode(id: string): LayoutNode;
        getNodes(): LayoutNode[];
        getNodesDict(): {
            [id: string]: LayoutNode;
        };
        getEdge(source: string, destination: string): LayoutEdge;
        getEdges(): LayoutEdge[];
        getEdgesDict(): {
            [id: string]: LayoutEdge;
        };
        toggleExpanded(id: string): void;
        setExpanded(id: string, expanded: boolean): void;
        setAllExpanded(ids: string[], expanded: boolean): void;
        addNodeStyle(style: INodeStyle): void;
        removeNodeStyle(name: string): void;
        getNodeStyles(): INodeStyle[];
        private updateYNodeStyle(id, nodeStyle);
        private removeNodeFromGraph(id);
        private removeEdgeFromGraph(id);
        private resolveNodeStyle(nodeStyle);
        private markAllGraphElementsStale();
        private establishNodeHierarchy();
        private filterGraphNodesForIncrementalDiff();
        private filterGraphEdgesForIncrementalDiff();
        private restoreNodeDefaultSize(node);
        private translateGraphToOrigin();
        private updateNodeLayouts();
        private updateEdgeLayouts();
        private getEdgePortFromRelativePoint(relPoint, nodeLayout);
    }
}

declare module HyperGraph.Layout {
    /**
     * A custom layouter used by an RGL to place grouped nodes in a simple column
     * It maintains the current ordering of grouped nodes
     */
    class SimpleColumnLayouter {
        constructor();
        applyLayout(graph: yfiles.layout.LayoutGraph): void;
    }
    /**
     * A custom layouter responsible for routing edges in a column layout (self-links)
     * Shapes edges into a two-bend U-style shape and shares segments between connected nodes
     * IE if A -> B and B -> A, their edges should share a vertical segment
     */
    class SelfLinkRouter {
        minDistanceFromNodes: number;
        distanceBetweenChannels: number;
        portCandidateYOffset: number;
        numberOfChannels: number;
        constructor();
        clearEdgePoints(graph: yfiles.layout.LayoutGraph, selfEdges: yfiles.algorithms.Edge[]): void;
        applyLayout(graph: yfiles.layout.LayoutGraph, selfEdges: yfiles.algorithms.Edge[]): void;
        private tryMergeChannels(mergeBase, channel);
        private routeEdge(graph, edge, channelIndex);
    }
    /**
     * A custom layouter which uses an IHL and an RGL to achieve the unique ADM-style layouts
     */
    class RecursiveHierarchicColumnLayouter implements ILayoutAlgorithm {
        portCandidateYOffset: number;
        private hierarchicLayouter;
        private recursiveLayouter;
        private columnLayouter;
        private selfLinkRouter;
        constructor();
        applyLayout(graph: yfiles.layout.LayoutGraph, mode: LayoutMode, incrementalNodes?: IncrementalNodesMap, incrementalEdges?: IncrementalEdgesMap, nodeOrderMap?: NodeOrderMap): void;
    }
}




declare module DependencyMap {
    const version = "2.0.5";
}


/// <reference types="q" />
declare module DependencyMap {
    class AdmController extends HyperGraph.Controller {
        NAME: string;
        mapStyle: MapStyle;
        getMachineDetailsInSpecificGroup: boolean;
        contextMenuYOffsetForTopLevelNode: number;
        constructor(widget: HyperGraph.GraphWidget, mapStyle: MapStyle);
        initEventHandlers(): void;
        /**
         * Workaround for IE 11's lack of CSS support in SVG shapes.
         * Mouse enter/leave will dynamically adjust action bar height and node rect height.
         */
        actionBarMouseHandler(event: MouseEvent, node: GraphNode, action: string, domId: string, resolvedTargetElement: any, expanded: boolean): void;
        nodeMouseHandler(event: MouseEvent, node: GraphNode, action: string, domId: string, resolvedTargetElement: any): boolean;
        nodeToggledEventHandler(node: GraphNode): Q.Promise<void>;
        private _showContextMenu(event, node);
        private _getMachineDetails(node, mapApiProvider, telemetryCorrelationId);
        private _getClientGroupDetails(node, mapApiProvider, telemetryCorrelationId);
        private _getServerGroupDetails(node, mapApiProvider, telemetryCorrelationId);
    }
}

declare module DependencyMap {
    /**
     * HyperGraph model
     */
    class AdmGraphModel extends HyperGraph.DefaultGraphModel {
        NAME: string;
        admModel: DependencyMap.MapModel;
        enableEdgeSelection: boolean;
        private popupManager;
        private isV3;
        private collapseAllMachines;
        private admLayoutStyles;
        constructor(admMapModel: DependencyMap.MapModel, admLayoutStyles: AdmLayoutStyles, enableSimpleMapLayout?: boolean);
        enableSimpleMapLayout(): void;
        setModel(collapseAllMachines: boolean, mapModel: DependencyMap.IMap, isApiV3?: boolean, groupAsSingleNode?: boolean): void;
        addNodeBadge(nodeId: any, badge: any): void;
        showNonAgentBackends(visible: boolean): void;
        /**
         * Overrides GraphModel version to perform additional validation.
         */
        addEdge(sourceNodeId: string, destNodeId: string, properties?: Object): GraphEdge;
        private loadNodes(nodeMap, isApiV3?, groupAsSingleNode?);
        updateGroupDetailsInAdmGraph(groupId: string, members: IClientOrServerGroupMemberMachine[]): void;
        addClientGroupMembersVirtualConnections(connections: IClientGroupMemberVirtualConnection[]): void;
        addServerGroupMembersVirtualConnections(connections: IServerGroupMemberVirtualConnection[]): void;
        notify(): void;
        toggleSelfLinks(nodeId: string): void;
        /**
        * Overridden to update aggregate edge properties. for V3, we should refactor the hypergraph to remove this logic.
        */
        protected _addAggregateEdge(source: string, dest: string, edge: GraphEdge): HyperGraph.GraphEdge;
        private loadAllMachineNodes(machines);
        private loadGroupAsSingleNode(virtualGroupNode);
        private isConnectedProcessGroup(processgroup);
        private addProcessGroupToGraph(processGroup, processGroupParentNode, rootNode);
        private _mapNodeComparator(leftData, rightData);
        private loadEdges(mapModel);
        private createEdgeFromConnection(sourceNodeId, destNodeId, connection);
        private createSyntheticNodeId(entityId, parentId);
    }
}

import Dictionary = HyperGraph.Dictionary;
import GraphNode = HyperGraph.GraphNode;
import GraphEdge = HyperGraph.GraphEdge;
declare module DependencyMap {
    class AdmGraphNodeOrderer2 implements HyperGraph.NodeOrderer {
        graphModel: HyperGraph.GraphModel;
        constructor(graphModel?: HyperGraph.GraphModel);
        setGraphModel(graphModel: HyperGraph.GraphModel): void;
        getSuggestedOrder(): {
            [id: string]: string[];
        };
        private _processNodeComparator(left, right);
    }
}

declare module DependencyMap {
    interface NodeRenderingConstants {
        haloMargin: number;
        haloBorderWidth: number;
        actionBarHeight: number;
        actionBarMinimizedHeight: number;
        actionBarHeightBump: number;
        actionBarBorderWidth: number;
        borderWidth: number;
        selectedBorderWidth: number;
    }
    type RendererName = "node" | "edge" | "machine" | "clientGroup" | "serverGroup" | "process" | "processGroup" | "groupedMachine" | "unconnectedProcessesGroup" | "clientAndServerGroupV3" | "groupMember" | "virtualGroup" | "placeholder";
    const RENDERER_NODE: RendererName;
    const RENDERER_EDGE: RendererName;
    const RENDERER_MACHINE_NODE: RendererName;
    const RENDERER_CLIENT_GROUP_NODE: RendererName;
    const RENDERER_SERVER_GROUP_NODE: RendererName;
    const RENDERER_PROCESS_GROUP_NODE: RendererName;
    const RENDERER_PROCESS_NODE: RendererName;
    const RENDERER_GROUPED_MACHINE_NODE: RendererName;
    const RENDERER_GROUP_MEMBER_NODE: RendererName;
    const RENDERER_UNCONNECTED_PROCESSES_NODE: RendererName;
    const RENDERER_CLIENT_AND_SERVER_GROUP_NODEV3 = "clientAndServerGroupV3";
    const RENDERER_VIRTUAL_GROUP_NODE: RendererName;
    const RENDERER_PLACEHOLDER_NODE: RendererName;
    class AdmGraphStage extends HyperGraph.GraphStageDom {
        private mapStyle;
        private admLayoutStyles;
        private admGraphModel;
        private admGraphWidget;
        constructor(graphWidget: AdmGraphWidget, mapStyle: MapStyle, layoutStyles: AdmLayoutStyles, graphModel: AdmGraphModel);
        attach(domElement: JQuery): void;
        addRenderer(layerName: RendererName, renderer: HyperGraph.DomRenderer): void;
        getRendererKey(entity: HyperGraph.GraphEntity): RendererName;
        private addSvgDefs();
        private addClipPathsToSvgDef();
        private addImage(svgDefs, id, path, width, height);
        private addSvg(svgDefs, id, svgString, width, height);
        private addDropShadowFilter(svgDefs, id, offsetX, offsetY, floodColor, filterHeight?);
    }
}

declare module DependencyMap {
    interface AdmGraphWidgetOptions {
        admMapModel: MapModel;
        mapStyle: MapStyle;
        layoutStyles: AdmLayoutStyles;
        enableSimpleMapLayout?: boolean;
    }
    class AdmGraphWidget extends HyperGraph.GraphWidget {
        static ResourceStrings: any;
        static MapImagesRelativePath: string;
        apiDataProvider: IMapApiDataProvider;
        mapStyle: MapStyle;
        controller: AdmController;
        constructor(element: JQuery, options: AdmGraphWidgetOptions);
        addNodeBadge(nodeId: string, badge: DependencyMap.Integrations.MapBadge): void;
        showNonAgentBackends(enabled: boolean): void;
        clear(): void;
        protected createModel(): HyperGraph.GraphModel;
        getMapModel(): MapModel;
        protected createStage(): AdmGraphStage;
        protected createControllers(): any;
    }
}

declare module DependencyMap {
    class AdmLayoutStyles {
        mapStyle: MapStyle;
        constructor(mapStyle: MapStyle);
        readonly NodeStyles: {
            [name: string]: HyperGraph.Layout.INodeStyle;
        };
        private static _rectangularNodeStyles;
        private static _circularNodeStyles;
    }
}

/// <reference types="knockout" />
/// <reference types="q" />
declare module DependencyMap {
    interface IComputerInfo {
        computerName: string;
        displayName: string;
        id: string;
    }
    /**
    Options accepted by methods initializeDependencyMap or initializeDependencyMapV3 should follow this interface contract.
     */
    interface DependencyMapOptions {
        /**
        @deprecated
        If this value is specified explicitely to 'flase' then all machine nodes in the graph are expanded.
        This option will be omitted if the map being opened is V3 version.
        In new API contract, UX has to make API call to get the process level details to expand any machine node.
         */
        collapseAllMachines: boolean;
        /**
         This list is optional.
         If this list is provided then the library will try to get all Alerts and log events associated to each and every machine
         in the list and render them in the graph.
         */
        computerInfo?: IComputerInfo[];
        /**
         * ResourceId of which the being is being rendered
         */
        mapId: string;
        /**
         * Display name of the resource.
         */
        mapDisplayName: string;
        /**
         * Type of the map.
         * Current supported values are "groupMap" and "singleVmMap"
         */
        mapType: string;
        /**
        This list is an array of node ids which need to be highlighted in the graph.
        This is optional list.
         */
        highlightEntities?: string[];
        /**
        * show navigation Icon for Health tab.
        * This parameter is specific to VmInsights.
        */
        showHealthBadge?: boolean;
        /**
         * This flag indicates if group map need to be rendered as
         */
        groupAsSingleNode?: boolean;
    }
    enum MapStyle {
        Circular = 0,
        Rectangular = 1,
    }
    enum ErrorCode {
        EmptyMachineGroup = 1,
        MachineDoesNotExist = 2,
        UnknownError = 3,
    }
    interface INavigationDisplayContent {
        id: string;
        displayName: string;
        isCurrent: boolean;
    }
    class AdmMap {
        static INITIAL_SERVERPORT_GROUP_COUNT: number;
        NAME: string;
        MAP_MAX_NUM_NODES: number;
        MAP_MAX_NUM_EDGES: number;
        private Strings;
        loadState: KnockoutObservable<LoadState>;
        showExpandCollapseButton: KnockoutObservable<boolean>;
        showSaveMapCommand: KnockoutObservable<boolean>;
        showFilterButton: KnockoutObservable<boolean>;
        mapPlaceholderImagePath: KnockoutObservable<string>;
        mapWarningImagePath: KnockoutObservable<string>;
        mapModel: KnockoutObservable<MapModel>;
        selectionContext: KnockoutObservable<SelectionContext>;
        enableCircularStyles: KnockoutObservable<boolean>;
        timeInterval: KnockoutObservable<TimeInterval>;
        mapContext: KnockoutObservable<MapContext>;
        onlyShowGroupProcesses: KnockoutObservable<string>;
        showNonAgentBackends: KnockoutObservable<boolean>;
        navigationButtonVisible: KnockoutObservableBase<boolean>;
        navigationButtonDisplayText: KnockoutObservableBase<string>;
        isError: KnockoutObservable<boolean>;
        kind: DependencyMap.Api.v2.MapRequestKind;
        mapName: string;
        legendVisible: KnockoutObservable<boolean>;
        filterVisible: KnockoutObservable<boolean>;
        isIncremental: KnockoutObservable<boolean>;
        mapContextError: KnockoutObservable<string>;
        mapStyle: KnockoutObservable<MapStyle>;
        progressStatus: KnockoutComputed<string>;
        private admGraphWidget;
        private clientGroupsToCount;
        private progressIndicator;
        private popupManager;
        private layoutComputed;
        private layoutStyles;
        private enableEdgeSelection;
        private mapApiDataProvider;
        private $mapContainer;
        private dashboardOptions;
        private mapRawDataV3;
        private mapBadges;
        private mapRawDataV2;
        private mapOptions;
        private _mapNavigationContext;
        private mapApiSessionId;
        /**
        *   This is id of computer or computerGroup whose map is rendered currently.
        */
        private _id;
        constructor($element: JQuery, options?: DependencyMapDashBoardOptions);
        setMapStyleToPreview(): void;
        setMapStyleToClassic(): void;
        initializeDependencyMapV3(data?: Api.v3.MapResponse, options?: DependencyMapOptions): Q.Promise<void>;
        handleErrorCode(errorCode: ErrorCode): any;
        clearMap(clearMapNavigationContext?: boolean): void;
        initializeDependencyMap(rawData: DependencyMap.Api.Data, options?: DependencyMapOptions): void;
        setMapState(mapState: DependencyMap.LoadState): void;
        /**
         * Adds given custom properties to their corresponding map nodes.
         * These custom properties are used to display default properties panel.
         * @param customizedProperties
         */
        assignCustomizedProperties(customizedProperties: DependencyMap.Api.v2.CustomizedProperty[]): void;
        updateClientGroupMemberCollection(clientGroupMemberCollection: Api.v2.ClientGroupMembersCollection[]): void;
        /**
         * updates the selection context to communicate the active selection with other components
         * @param entity
         */
        updateSelectionContext(selectedNodes: IMapNode[], selectedEdge: IMapEdge, badgeType?: BadgeType): void;
        toggleMapLegend: (data: any, event: any) => void;
        hideMapLegend: () => void;
        toggleProcessesFilter: () => void;
        hideProcessesFilter: () => void;
        /**
         * Adds badges to the monitored machines.
         * @param badges Badges to be added. They are Alerts, updates, changeTracking
         */
        addNodeBadges(badges: Integrations.MapBadge[]): void;
        saveMapAsSvg(): void;
        navigateToPrevContext(): void;
        updateServerPortsVisibility(portIds: string[]): void;
        zoomFitMap(): void;
        enableSimpleMapLayout(): void;
        /**
         * Processes the raw json returned by GetCoarseMap API.
         * @param data
         * @param showHealthBadge: This is a boolean parameter sepecific to VmInsights.
         * If this parameter is specified we show an Icon at the Machine node and a navigation behaviour to
         * Health tab.
         */
        private processCoarseMapData(data, options?);
        /**
        This method parses this._id, gets the workspace and updates the TelemteryGlobalContext
         */
        private updateTelemetryGlobalContext();
        private createGraphWidget();
        private loadData(coarseMapResult, options?);
        /**
         * Add clientGroup members of V2 API.
         * All members are unmonitored only.
         * @param clientCloudInfo Client group member array
         * @param mapModel map model
         */
        private updateClientGroupMembers(clientCloudInfo, mapModel);
        private convertClientCloudInfoId(clientCloudInfoId);
        private progressHandler(progressInfo);
        private getNodeCount(mapResult);
        private getEdgeCount(mapResult);
        protected addGraphEventHandlers(): void;
        private loadNodeServerMap(node);
        private saveNavigationContext(mapApiResponse, mapOptions);
        private toggleNodeSelfLinks(node);
        private viewDetailedGroupMap(node);
        private expandOrCollapseNode(node);
        private zoomInMap(steps?);
        private zoomOutMap(steps?);
        private expandAllNodes();
        private collapseAllNodes();
        private calculateCoordinatesForServerPortsConfigNode();
    }
}

declare module DependencyMap {
    var BigPort: HyperGraph.GraphWidgetPort;
    var SmallPort: HyperGraph.GraphWidgetPort;
    var PortYOffset: number;
    enum HttpStatusCode {
        OK = 200,
    }
}

/**
 * AdmMapModel is the encompassing model that contains the entities, connections,
 * and other data the UI uses to represent the domain of a map.
 * It's the right place to augment the simple model returned by the API in ways that are useful to the UI
 * e.g. identify and mark self-links, roll up process roles to machine, etc.
 */
declare module DependencyMap {
    class MapModel implements IMap {
        readonly NAME: string;
        entities: {
            [id: string]: IEntity;
        };
        ips: {
            [ipAddress: string]: IEntity;
        };
        machineToClientOrServerGroupMap: {
            [id: string]: GroupViewModelV3[];
        };
        nodes: NodeMap;
        edges: EdgeMap;
        badges: Integrations.MapBadge[];
        visitedNodes: string[];
        machineGroupMap: {
            [id: string]: IMachine;
        };
        private highlyUsedServerPorts;
        private readonly maxNumberOfServerPortsVisible;
        constructor();
        setModel(mapResult: Api.v2.Map, mapContext: MapContext): void;
        setModelV3(modelResponse: Api.v3.MapResponse, mapContext: MapContext, groupAsSingleNode: boolean): void;
        getEntityById(entityId: string, ignoreCase?: boolean): IEntity;
        /**
         * Returns the first entity with computer name
         * (not any other node like client group, etc.)
         *
         * @param computerName name of the computer machine to retrieve
         */
        getEntityByComputerName(computerName: string): IEntity;
        /**
         * Returns the first machine matching `resourceId`
         * @param resourceId the ARM ID
         */
        getEntityByResourceId(resourceId: string): IEntity;
        getMapNodeById(nodeId: string): IMapNode;
        getClientOrServerGroups(memberMachineId: string): GroupViewModelV3[];
        updateGroupDetails(groupId: string, groupMemberMap: Api.v3.ClientOrServerGroupMachineMap): {
            groupMembers: IClientOrServerGroupMemberMachine[];
            clientGroupMemberConnections: IClientGroupMemberVirtualConnection[];
            serverGroupMembersConnections: IServerGroupMemberVirtualConnection[];
        };
        hasVisited(nodeId: string): boolean;
        updateMapModelV3(mapResponse: Api.v3.MapResponse): {
            map: IMap;
            clientgroupMemberVirtualConnections: ClientGroupMemberVirtualConnection[];
            serverGroupMemberVirtualConnections: ServerGroupMemberVirtualConnection[];
        };
        /**
         * This method sets the serverPorts visibility.
         * If there are any portIds are passed to this method, then we set only those ports visible in the Map.
         * Else, we follow below order to mark serverPorts visible.
         * 1. Always mark ports with failed connections as Visibile
         * 2. Always mark ports 443 and 80 as visible.
         * 3. Give preference to ports with more dependencies
         * @param portIds
         */
        updateServerPortsVisibility(portIds: string[]): void;
        private addMachineApiDataToMapModel(machineRawData, entities, machineResult, machineGroupMembers, ips);
        private addProcessesApiDataToMapModel(processesRawData, processGroupRawData, processResult, processGroupResult);
        private addClientGroupApiDataToMapModel(clientGroupsRawData, entities, newlyAddedClientGroup);
        private addServerGroupApiDataToMapModel(serverGroupsRawData, entities, newlyAddedServerGroup);
        private addConnetionApiDataToMapModel(connectionRawData, entities, newlyAddedConnections, servergroupMemberVirtualConnections?);
        private getRootNode(data);
        private addProcessSummaryApiDataToMapModel(processSummaries, entities);
        private addClientGroupSummaryApiDataToMapModel(clientGroupSummariesRawData, entities, clientOrServerGroupMemberMachines, machineGroupMap);
        private addServerGroupSummaryApiDataToMapModel(serverGroupSummariesRawData, entities, clientOrServerGroupMemberMachines, machineGroupMap);
        private addClientOrServerGroupMembersToGroup(members, groupViewModel, memberCount, entities, machineGroupMap, isMonitored);
        private clearLocalCache();
        /**
         * Get the source or destination process from a connection entity
         * Note: connections are typically modeled as process to process
         * @param connection
         * @param getSource true for source, false for destination
         */
        getProcessByConnection(connection: IConnection, getSource: boolean): IProcess;
        /**
         * Get the source or destination machine from a connection entity
         * Note: connections are typically modeled as process to process
         * @param connection
         * @param getSource true for source, false for destination
         */
        getMachineByConnection(connection: IConnection, getSource: boolean): IMachine;
        /**
         * Set an arbitrary, untyped property on an entity
         * Useful for allowing integrations to attach data to nodes
         * @param nodeId
         * @param name
         * @param value
         */
        setEntityProperty(entityId: string, name: string, value: any): void;
        /**
         * Append a badge to a mapNode's badge list
         * @param nodeId
         * @param badge
         */
        addNodeBadge(nodeId: string, badge: Integrations.MapBadge): IMapNode;
        toggleSelfLinks(nodeId: string): void;
        /**
         * Get count of machine clients for an entity, taking into account a possible client group
         * @param entity
         */
        getClientMachinesCount(entity: Machine | Process | ProcessGroup): ApproximatedCount;
        /**
         * Get count of machine servers for an entity
         * @param entity
         */
        getServerMachinesCount(entity: Machine | Process | ProcessGroup): ApproximatedCount;
    }
}

declare module DependencyMap {
    var AdmMapResources: {
        all: string;
        alertsBlueBadge: string;
        alertsRedBadge: string;
        alertsYellowBadge: string;
        AllConnectionsOption: string;
        appServerRoleIcon: string;
        backTo: string;
        caretDownLightIcon: string;
        caretUpLightIcon: string;
        caretDownDarkIcon: string;
        caretUpDarkIcon: string;
        changeTrackingBadge: string;
        clientGroupIcon: string;
        ContextMenu: string;
        databaseRoleIcon: string;
        errorBadge: string;
        ErrorMapEmptyGroup: string;
        ErrorMachineDoesNotExist: string;
        ErrorMapGeneric: string;
        ErrorMapNoActiveMachines: string;
        ErrorMapTooLarge: string;
        ExampleMapTitle: string;
        GroupConnectionsOption: string;
        HideSelfLinks: string;
        ldapRoleIcon: string;
        linuxIcon: string;
        LoadServerMap: string;
        ExpandGroup: string;
        ExpandNode: string;
        CollapseNode: string;
        MapControlCollapseAll: string;
        MapControlExpandAll: string;
        MapControlFilter: string;
        MapControlHelp: string;
        MapControlZoomFit: string;
        MapControlZoomIn: string;
        MapControlZoomOut: string;
        MapLegendAppServer: string;
        MapLegendConnections: string;
        MapLegendConnectionsSubtitle: string;
        MapLegendDatabase: string;
        MapLegendFailed: string;
        MapLegendHeader: string;
        MapLegendInbound: string;
        MapLegendLdap: string;
        MapLegendMachineRoles: string;
        MapLegendOutbound: string;
        MapLegendSelfLink: string;
        MapLegendSmb: string;
        MapLegendWebServer: string;
        menuIconDark: string;
        menuIconLight: string;
        NodeHeaderClientGroupPlural: string;
        NodeHeaderClientGroupSingular: string;
        NodeHeaderPortPlural: string;
        NodeHeaderPortSingular: string;
        NodeHeaderProcessPlural: string;
        NodeHeaderProcessSingular: string;
        NodeHeaderServerPlural: string;
        NodeHeaderServerSingular: string;
        ProcessesFilterHeader: string;
        NodeHeaderComputersPlural: string;
        NodeHeaderComputersSingular: string;
        ProgressComputingLayout: string;
        ProgressLoadingData: string;
        ProgressRenderingGraph: string;
        securityBlueBadge: string;
        securityRedBadge: string;
        securityYellowBadge: string;
        serverGroupIcon: string;
        serviceDeskBlueBadge: string;
        serviceDeskRedBadge: string;
        serviceDeskYellowBadge: string;
        ShowNonAgentBackends: string;
        ShowSelfLinks: string;
        SkeletonHintText: string;
        smbRoleIcon: string;
        updatesBlueBadge: string;
        updatesRedBadge: string;
        updatesYellowBadge: string;
        warningBadge: string;
        webServerRoleIcon: string;
        windowsIcon: string;
        UnconnectedProcessgroupDisplayName: string;
        SummaryCountDependenciesHeader: string;
        SummaryCountClients: string;
        SummaryCountServers: string;
        SummaryCountConnectionsHeader: string;
        SummaryCountFailedConnections: string;
        SummaryCountInboundConnections: string;
        SummaryCountOutboundConnections: string;
        FqdnHeader: string;
        OperatingSystemLongHeader: string;
        IPv4AddressesHeader: string;
        IPv6AddressesHeader: string;
        MacAddressesHeader: string;
        CPUsHeader: string;
        DNSNamesHeader: string;
        MegahertzUnit: string;
        PhysicalMemoryHeader: string;
        MegabytesUnit: string;
        VMStateHeader: string;
        VMTypeHeader: string;
        HypervisorTypeHeader: string;
        HyperVType: string;
        LDOMType: string;
        LogicalPartitionType: string;
        VMwareType: string;
        VirtualPCType: string;
        XenType: string;
        LastRebootHeader: string;
        OMSAgentIDHeader: string;
        ADMAgentIDHeader: string;
        ADMAgentVersionHeader: string;
        DisplayNameHeader: string;
        ExecutableNameHeader: string;
        DescriptionHeader: string;
        UsernameHeader: string;
        DomainHeader: string;
        CompanyNameHeader: string;
        ProductNameHeader: string;
        ProductVersionHeader: string;
        WorkingDirectoryHeader: string;
        CommandLineHeader: string;
        ClientGroupOverviewHeader: string;
        ClientGroupExplanation: string;
        ClientGroupCountsHeader: string;
        ClientGroupCountsUnmonitored: string;
        ClientGroupCountsIpPortPairs: string;
        ClientGroupMemberListHeader: string;
        IpAddress: string;
        EntityTypePort: string;
        ServerGroupDescription: string;
        DNSNameSingular: string;
        EntityTypeMachine: string;
        EntityTypeMachinePlural: string;
        EntityTypeProcess: string;
        EntityTypeProcessPlural: string;
        EntityTypeClientGroup: string;
        EntityTypeClientGroupPlural: string;
        EntityTypeServerGroup: string;
        EntityTypeServerGroupPlural: string;
        EntityTypeProcessGroupPlural: string;
        EntityTypeProcessGroup: string;
        less: string;
        more: string;
        NotMonitoredHeader: string;
        NotMonitoredMessage: string;
        ServerSideInfo: string;
        ClientSideInfo: string;
        navigateToPreviousMap: string;
        ViewAllPorts: string;
        Connection: string;
    };
    var lcl: {};
}

/// <reference types="d3" />
declare module DependencyMap {
    class HelperUtils {
        static addImage(svgDefs: d3.Selection<any>, id: string, path: string, width: number, height: number, x: number, y: number, title: string, visibility: boolean, focusable?: boolean, customClass?: string): d3.Selection<any>;
        static SelectGraphNode(node: GraphNode): void;
        static SelectGraphEdge(edge: MapEdge): void;
    }
}

declare module DependencyMap {
    class MapImages {
        static readonly light_caret_up: string;
        static readonly light_caret_down: string;
        static readonly light_ellipsis: string;
        static readonly light_client_group: string;
        static readonly light_linux: string;
        static readonly dark_caret_up: string;
        static readonly dark_caret_down: string;
        static readonly dark_ellipsis: string;
        static readonly dark_linux: string;
        static readonly dark_client_group: string;
        static readonly triangle_expand: string;
        static readonly triangle_collapse: string;
        static readonly failed_connection_status: string;
        static readonly chevron_left: string;
        static readonly chevron_right: string;
        static readonly chevron_left_disabled: string;
        static readonly chevron_right_disabled: string;
        static readonly collapse_box: string;
        static readonly expand_box: string;
        static readonly windows_logo: string;
        static readonly triangle_bang_yellow: string;
        static readonly circle_bang_red: string;
        static readonly alerts_blue: string;
        static readonly alerts_yellow: string;
        static readonly alerts_red: string;
        static readonly change_tracking_blue: string;
        static readonly security_blue: string;
        static readonly security_yellow: string;
        static readonly security_red: string;
        static readonly service_desk_blue: string;
        static readonly service_desk_yellow: string;
        static readonly service_desk_red: string;
        static readonly updates_blue: string;
        static readonly updates_yellow: string;
        static readonly updates_red: string;
        static readonly vm_health: string;
        static readonly configure: string;
        static readonly configure_light: string;
    }
}

declare module DependencyMap {
    /**
     * Below enum defines various Map navigation operations during interaction with Main map canvas
     */
    enum MapNavigationOperation {
        LoadSingleNodeMap = "LoadSingleNodeMap",
        GroupAsSingleNodeMap = "GroupAsSingleNodeMap",
        DetailedGroupMap = "DetailedGroupMap",
    }
    interface IMapNavigationOperationContext {
        id: string;
        mapOperation: MapNavigationOperation;
        displayName: string;
        mapApiResponse: Api.v3.MapResponse;
        mapOptions: DependencyMapOptions;
    }
    class MapNavigationContext {
        private mapNavOperationContexts;
        saveMapNavigationContext(mapNavigationOperation: IMapNavigationOperationContext): void;
        popMapNavigationContext(): IMapNavigationOperationContext;
        getNavigationStackLength(): number;
        getNavigationButtonDisplayName(): string;
        clearMapNavigationContext(): void;
    }
}


declare module DependencyMap {
    class AdmMapTemplate {
        static template: string;
    }
}


/// <reference types="d3" />
declare module DependencyMap {
    class AdmBadgeIconCircularRenderer extends HyperGraph.DomRenderer {
        static badgeIconIds: {
            alerts_blue: string;
            alerts_yellow: string;
            alerts_red: string;
            change_tracking_blue: string;
            security_blue: string;
            security_yellow: string;
            security_red: string;
            "service-desk-blue": string;
            "service-desk-yellow": string;
            "service-desk-red": string;
            updates_blue: string;
            updates_yellow: string;
            updates_red: string;
        };
        static badgeIconPaths: {
            alerts_blue: string;
            alerts_yellow: string;
            alerts_red: string;
            change_tracking_blue: string;
            security_blue: string;
            security_yellow: string;
            security_red: string;
            "service-desk-blue": string;
            "service-desk-yellow": string;
            "service-desk-red": string;
            updates_blue: string;
            updates_yellow: string;
            updates_red: string;
        };
        constructor(layer: HyperGraph.GraphStageLayer);
        getContainerId(node: GraphNode): string;
        renderToDom(node: GraphNode, svgContainer: d3.Selection<any>): d3.Selection<any>;
        private allBadgesEmphasisOnly(badges);
        private getBadgeWidths(badges, badgeIconWidth);
        private getDigitCount(num);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * This is a base class for all collapsed circular nodes.
     * All circular nodes moseHover behavious should be same.
     */
    class AdmBaseNodeCircularRenderer extends AdmBaseNodeRenderer {
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmClientAndServerGroupCircularRendererV3 extends AdmPageableNodeCircularBaseRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        actionBarRenderer: AdmActionBarRenderer;
        badgeIconRenderer: AdmBadgeIconRenderer;
        graphWidget: AdmGraphWidget;
        static iconRadius: number;
        static iconWidth: number;
        static iconHeight: number;
        static outerCircleRadius: number;
        static filterHighlighterCurvStokeWidth: number;
        static filterHighlighterLineStrokeWidth: number;
        static filterStrokeWidth: number;
        constructor(graphWidget: AdmGraphWidget, layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        private renderHealthCircle(node, nodeSvgContainer, centerX, centerY);
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getLeftBorderLineId(node);
        private getRightBorderLineId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmClientGroupCircularRenderer extends AdmBaseNodeRenderer {
        static clientGroupIconRadius: number;
        static clientGroupIconWidth: number;
        static clientGroupIconHeight: number;
        static clientGroupOuterCircleRadius: number;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmEdgeCircularRenderer extends HyperGraph.DomRenderer {
        stage: HyperGraph.GraphStageDom;
        layoutStyles: AdmLayoutStyles;
        graphModel: AdmGraphModel;
        constructor(layer: HyperGraph.GraphStageLayer, layoutStyles: AdmLayoutStyles, admGraphModel: AdmGraphModel);
        addContainerToDom(edge: GraphEdge, svgContainer: d3.Selection<any>): d3.Selection<any>;
        renderToDom(edge: GraphEdge, edgeContainer: d3.Selection<any>): d3.Selection<any>;
        getArrowheadTransform(edge: GraphEdge): string;
        protected getLineDisplayClasses(edge: GraphEdge, customizeClass?: string): string;
        protected getFillDisplayClasses(edge: GraphEdge): string;
        private _adjustServerGroupEdge(edge);
        private _adjustConectionFromExpandedNode(edge);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * For machines that appear in Client and Server Groups. Similar to process renderer but
     * has ellipsis menu and no role icon.
     */
    class AdmGroupMemberV3CircularRenderer extends AdmGroupMemberV3Renderer {
        portRenderer: AdmNodePortCircularRenderer;
        admGraphWidget: AdmGraphWidget;
        contextMenuXOffset: number;
        contextMenuYOffset: number;
        constructor(graphWidget: AdmGraphWidget, layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getBgRectId(node);
        private getContextIconId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmMachineNodeCircularRenderer extends AdmBaseNodeRenderer {
        badgeIconRenderer: AdmBadgeIconCircularRenderer;
        graphWidget: AdmGraphWidget;
        static osLogoRadius: number;
        static osIconWidth: number;
        static osIconHeight: number;
        static haloCircleRadiusAdjustmentSelected: number;
        static haloCircleRadiusAdjustmentUnSelected: number;
        constructor(graphWidget: AdmGraphWidget, layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        /**
         * @param svgContainer layer container for all nodes
         * Returns the node group container for updates
         */
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getLeftBorderLineId(node);
        private getRightBorderLineId(node);
        private getContextIconId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmNodePortCircularRenderer implements HyperGraph.GraphEntityRenderer {
        layer: HyperGraph.GraphStageLayer;
        constructor(layer: HyperGraph.GraphStageLayer);
        renderToDom(port: HyperGraph.GraphNodePort, svgContainer: d3.Selection<any>, visible?: boolean): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    interface HealthFilterHighighterDimensions {
        innerHighlighterStartX: number;
        innerHighlighterStartY: number;
        innerHighlighterEndX: number;
        innerHighlighterEndY: number;
        innerHighlighterRadius: number;
        outerHighlighterStartX: number;
        outerHighlighterStartY: number;
        outerHighlighterEndX: number;
        outerHighlighterEndY: number;
        outerHighlighterRadius: number;
    }
    class AdmPageableNodeCircularBaseRenderer extends AdmBaseNodeRenderer {
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        protected addNextAndPrevButtons(node: GraphNode, nodeViewModel: PageableGroupNodeViewModel, nodeGroup: d3.Selection<any>): void;
        protected renderHealthStatusFullCircle(node: GraphNode, nodeSvgContainer: d3.Selection<any>, healthState: GroupMemberHealthState, centerX: number, centerY: number): void;
        protected renderCircleSectionFromHealthState(node: GraphNode, nodeSvgContainer: d3.Selection<any>, healthState: GroupMemberHealthState, angle: number, x1: number, y1: number, x2: number, y2: number): void;
        protected renderCircleSectionHighlighter(node: GraphNode, nodeSvgContainer: d3.Selection<any>, healthState: GroupMemberHealthState, angle: number, filterHighlighterDimensions: HealthFilterHighighterDimensions): void;
        private getDomIdForHealthState(node, healthState);
        protected getColorForHealthState(healthState: GroupMemberHealthState): string;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmPlaceholderNodeCircularRenderer extends AdmBaseNodeCircularRenderer {
        static placeholderNodeIconRadius: number;
        static placeholderNodeIconWidth: number;
        static placeholderNodeIconHeight: number;
        static placeholderNodeOuterCircleRadius: number;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        /**
         * @param svgContainer layer container for all nodes
         * Returns the node group container for updates
         */
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmProcessGroupNodeCircularRenderer extends AdmProcessGroupNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getHeaderRectId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmProcessNodeCircularRenderer extends AdmProcessNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        static xCoordinate: number;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getBgRectId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmServerGroupCircularRenderer extends AdmBaseNodeCircularRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        actionBarRenderer: AdmActionBarRenderer;
        badgeIconRenderer: AdmBadgeIconRenderer;
        static serverGroupIconRadius: number;
        static serverGroupIconWidth: number;
        static serverGroupIconHeight: number;
        static serverGroupOuterCircleRadius: number;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        private getLeftBorderLineId(node);
        private getRightBorderLineId(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * For machines that appear in Server Groups. Similar to process renderer but
     * has ellipsis menu and no role icon.
     */
    class AdmServerGroupedMachineCircularRenderer extends AdmBaseNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmUnconnectedProcessGroupNodeCircularRenderer extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        static xCoordinate: number;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmVirtualGroupNodeCircularRenderer extends AdmPageableNodeCircularBaseRenderer {
        graphWidget: AdmGraphWidget;
        static virtualGroupNodeIconRadius: number;
        static virtualGroupNodeIconWidth: number;
        static virtualGroupNodeIconHeight: number;
        static virtualGroupNodeOuterCircleRadius: number;
        constructor(graphWidget: AdmGraphWidget, layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        /**
         * @param svgContainer layer container for all nodes
         * Returns the node group container for updates
         */
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        handleMouseOver(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>): void;
        handleMouseLeave(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, event: MouseEvent): void;
        private getLeftBorderLineId(node);
        private getRightBorderLineId(node);
        private getContextIconId(node);
        private renderHealthCircle(node, nodeSvgContainer, centerX, centerY);
    }
}


/// <reference types="d3" />
declare module DependencyMap {
    class AdmActionBarRenderer extends HyperGraph.DomRenderer {
        height: number;
        constants: NodeRenderingConstants;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        getContainerId(node: GraphNode): string;
        /**
         * There are two rendering patterns:
         *  1. svgContainer holds multiple elements, like nodes and edges
         *  2. svgContainer holds a single element, like a node's action bar
         *
         * Right now it's up the renderer to manage this properly.
         *
         * @param node
         * @param svgContainer
         */
        renderToDom(node: GraphNode, svgContainer: d3.Selection<any>, expandHeight?: boolean): d3.Selection<any>;
        expandActionBar(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, expandedHeight: boolean): void;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmBadgeIconRenderer extends HyperGraph.DomRenderer {
        static badgeIconIds: {
            alerts_blue: string;
            alerts_yellow: string;
            alerts_red: string;
            change_tracking_blue: string;
            security_blue: string;
            security_yellow: string;
            security_red: string;
            "service-desk-blue": string;
            "service-desk-yellow": string;
            "service-desk-red": string;
            updates_blue: string;
            updates_yellow: string;
            updates_red: string;
            vmHealth: string;
        };
        static badgeIconPaths: {
            alerts_blue: string;
            alerts_yellow: string;
            alerts_red: string;
            change_tracking_blue: string;
            security_blue: string;
            security_yellow: string;
            security_red: string;
            "service-desk-blue": string;
            "service-desk-yellow": string;
            "service-desk-red": string;
            updates_blue: string;
            updates_yellow: string;
            updates_red: string;
            vmHealth: string;
        };
        constructor(layer: HyperGraph.GraphStageLayer);
        getContainerId(node: GraphNode): string;
        renderToDom(node: GraphNode, svgContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * Base node renderer class. One renderer instance is shared by all nodes.
     */
    class AdmBaseNodeRenderer extends HyperGraph.DomRenderer {
        constants: NodeRenderingConstants;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        protected observeEntityProperties(): void;
        addContainerToDom(node: GraphNode, svgContainer: d3.Selection<any>): d3.Selection<any>;
        addChildContainerToDom(node: GraphNode, childDomId: string, svgContainer: d3.Selection<any>): d3.Selection<any>;
        expandNodeHeight(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, expandHeight: boolean): void;
        getAdjustedNodeY(node: GraphNode, expandHeight: boolean): number;
        getAdjustedNodeHeight(node: GraphNode, expandHeight: boolean): number;
        protected renderSelectionRectangle(node: GraphNode): void;
        protected getHaloCircleId(node: GraphNode): string;
        protected generateTriangleBasedOnTheme(isExpand: boolean): string;
        protected isDarkMode(): boolean;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmClientAndServerGroupRendererV3 extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        actionBarRenderer: AdmActionBarRenderer;
        portRenderer: AdmNodePortRenderer;
        badgeIconRenderer: AdmBadgeIconRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        getAdjustedNodeHeight(node: GraphNode, expandHeight: boolean): number;
        private renderHealthBarFilter(node, nodeSvgContainer);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmClientGroupRenderer extends AdmBaseNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

declare module DependencyMap {
    class AdmContextMenuRenderer implements HyperGraph.GraphContextMenuRenderer {
        localeStrings: any;
        constructor(localeStrings?: any);
        getContextMenuTemplate(event: Event, entities: any[]): string;
        private getLoadServerMapMenuItem(node);
        private getSelfLinksMenuItem(node);
        private getViewDetailedMapMenuItem(node);
        private getExpandOrCollapseNodeMenuItem(node);
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmEdgeRenderer extends HyperGraph.DomRenderer {
        stage: HyperGraph.GraphStageDom;
        /** Currently choosen graph style skin. Set by looking at parent widget ViewModel. */
        constructor(layer: HyperGraph.GraphStageLayer);
        addContainerToDom(edge: GraphEdge, svgContainer: d3.Selection<any>): d3.Selection<any>;
        renderToDom(edge: GraphEdge, edgeContainer: d3.Selection<any>): d3.Selection<any>;
        getArrowheadTransform(edge: GraphEdge): string;
        protected getLineDisplayClasses(edge: GraphEdge): string;
        protected getFillDisplayClasses(edge: GraphEdge): string;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * For machines that appear in Client and Server Groups. Similar to process renderer but
     * has ellipsis menu and no role icon.
     */
    class AdmGroupMemberV3Renderer extends AdmBaseNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmMachineNodeRenderer extends AdmBaseNodeRenderer {
        actionBarRenderer: AdmActionBarRenderer;
        roleIconRenderer: AdmRoleIconRenderer;
        badgeIconRenderer: AdmBadgeIconRenderer;
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        /**
         * @param svgContainer layer container for all nodes
         * Returns the node group container for updates
         */
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
        expandNodeHeight(node: GraphNode, d3NodeContainerGroup: d3.Selection<any>, expandHeight: boolean): void;
        getAdjustedNodeHeight(node: GraphNode, expandHeight: boolean): number;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmNodePortRenderer implements HyperGraph.GraphEntityRenderer {
        layer: HyperGraph.GraphStageLayer;
        constructor(layer: HyperGraph.GraphStageLayer);
        renderToDom(port: HyperGraph.GraphNodePort, svgContainer: d3.Selection<any>, visible?: boolean): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmProcessGroupNodeRenderer extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmProcessNodeRenderer extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmRoleIconRenderer implements HyperGraph.GraphEntityRenderer {
        private static roleIcons;
        constructor();
        renderToDom(node: GraphNode, svgContainer: d3.Selection<any>, yOffset?: number): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmServerGroupRenderer extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        actionBarRenderer: AdmActionBarRenderer;
        portRenderer: AdmNodePortRenderer;
        badgeIconRenderer: AdmBadgeIconRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    /**
     * For machines that appear in Server Groups. Similar to process renderer but
     * has ellipsis menu and no role icon.
     */
    class AdmServerGroupedMachineRenderer extends AdmBaseNodeRenderer {
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmUnconnectedProcessGroupNodeRenderer extends AdmBaseNodeRenderer {
        roleIconRenderer: AdmRoleIconRenderer;
        portRenderer: AdmNodePortRenderer;
        constructor(layer: HyperGraph.GraphStageLayer, constants: NodeRenderingConstants);
        renderToDom(node: GraphNode, svgNodeContainer: d3.Selection<any>): d3.Selection<any>;
    }
}

/// <reference types="d3" />
declare module DependencyMap {
    class AdmUnknownNodeRenderer extends AdmBaseNodeRenderer {
        constructor(layer: HyperGraph.GraphStageLayer);
        renderToDom(node: GraphNode, nodeGroup: d3.Selection<any>): d3.Selection<any>;
    }
}


/// <reference types="knockout" />
declare module AdmWrapper {
    class PopupEventManager {
        private closeHandlers;
        private events;
        private transferEvent;
        addCloseHandler(element: JQuery, callback: KnockoutObservable<boolean> | {
            (): void;
        }): void;
        clear(): void;
        removeCloseHandler(): void;
        dispose(): void;
    }
}

declare module DependencyMap.ProgressIndicators {
    class Bar {
        private containerElement;
        private markCount;
        private markInterval;
        private markAnimationLength;
        Start(): void;
        Stop(): void;
        constructor(container: any, markCount?: number, markInterval?: number, markAnimationLength?: number);
    }
}


/// <reference types="knockout" />
declare module DependencyMap {
    interface SummaryInfo {
        clientCount: string;
        serverCount: string;
        inboundConnections: string;
        outboundConnections: string;
        failedConnections: string;
    }
    interface ConnectionInfo {
        clients?: string[];
        servers?: string[];
        ports?: string[];
        ipAddress?: string[];
        displayName?: string[];
        failureState?: string;
        aggCount?: number;
    }
    class AdmPropertiesPanel {
        NAME: string;
        Strings: any;
        selectionContext: KnockoutObservable<SelectionContext>;
        panelCollapsed: KnockoutObservable<boolean>;
        entityIconClass: KnockoutObservable<string>;
        leftAlign: KnockoutObservable<string>;
        vmTypeFormatted: KnockoutObservable<string>;
        summaryInfo: KnockoutObservable<SummaryInfo>;
        connectionInfo: KnockoutObservable<ConnectionInfo>;
        entityTypeDisplayNames: DependencyMap.Integrations.IEntityTypeDisplayNameMap;
        mapModel: DependencyMap.IMap;
        constructor($element: JQuery, options?: DependencyMapDashBoardOptions);
        private togglePanel();
        private ProcessSelectEntity(entity);
        private getMachineSummaryData(machine);
        private getProcessSummaryData(process);
        private getProcessGroupSummaryData(processGroup);
        private getClientGroupInboundNumber(mapNode);
        private getEntityIconClass(entity);
        private processEntity(entity);
        private convertFailState(state);
        private getVmTypeFormatted(vmType);
    }
}

declare module DependencyMap {
    class AdmPropertiesPanelTemplate {
        static template: string;
    }
}


/// <reference types="knockout" />
interface HTMLElement {
    dateTimeSelector(method: string, property?: string, value?: any): any;
    fxRadio(method: string, property?: string, value?: any): any;
}
interface JQuery {
    dateTimeSelector(method: string, property?: string, value?: any): any;
    dateTimeSelector(options: any): any;
    fxRadio(options: any): any;
}
interface KnockoutBindingHandlers {
    dateTimeSelector: KnockoutBindingHandler;
}
interface Refresh {
    type: any;
}
interface KnockoutExtenders {
    date(target: KnockoutObservable<Date>): any;
    dateValidation(target: KnockoutObservable<string>, formats: string[]): any;
    defaultValue(target: KnockoutObservable<any>, value: any): any;
    formattedDuration(target: KnockoutObservable<number>, editable: boolean): any;
    regexValidation(target: KnockoutObservable<string>, regex: RegExp): any;
    timeInterval(target: KnockoutObservable<DependencyMap.TimeInterval>): any;
}
interface FormattedDurationDisplay {
    duration: number;
    unit: string;
}
declare module DependencyMap {
    interface TimeInterval {
        _duration: number;
        _end: Date;
        _Now: Date;
        _compareOffset?: number;
        _isAutoRefresh?: boolean;
    }
    class TimeIntervalSelectorV3 {
        cleanup: KnockoutObservable<any>;
        refresh: KnockoutObservable<Refresh>;
        timeIntervalIn: KnockoutObservable<TimeInterval>;
        timeIntervalOut: KnockoutObservable<TimeInterval>;
        allowFutureDates: KnockoutObservable<boolean>;
        durationLimit: KnockoutObservable<number>;
        minimumDuration: KnockoutObservable<number>;
        relativeDurations: KnockoutObservableArray<number>;
        customMode: KnockoutObservable<TimeIntervalSelector_CustomMode>;
        displayDialog: KnockoutObservable<boolean>;
        duration: KnockoutComputed<number>;
        endDate: KnockoutObservable<Date>;
        selectedUnit: KnockoutObservable<TimeIntervalSelector_Unit>;
        startDate: KnockoutObservable<Date>;
        units: KnockoutObservableArray<TimeIntervalSelector_Unit>;
        isRelative: KnockoutObservable<boolean>;
        readonly OneMinuteInMs: number;
        readonly ThirtyMinutesInMs: number;
        readonly OneHourInMs: number;
        readonly SixHoursInMs: number;
        readonly OneDayInMs: number;
        readonly SevenDaysInMs: number;
        readonly ThirtyDaysInMs: number;
        private linkedDuration;
        private popupManager;
        private Strings;
        constructor($element: JQuery, options?: any);
        apply(isRelative?: boolean): void;
        toggleCustom(): void;
        applyRelativeDuration: (duration: number) => void;
        isValidInterval(): boolean;
        toggleDialog(): void;
        private calcFormattedDuration(durationMS);
        private configureExtenders();
        private initializeWidgets(element);
    }
    enum TimeIntervalSelector_CustomMode {
        Duration = 1,
        End = 2,
    }
    class TimeIntervalSelector_Unit {
        factor: number;
        name: string;
        constructor(name: string, factor: number);
    }
}

declare module DependencyMap {
    class TimeIntervalSelectorResources {
        static resources: {
            "1MillisecondDurationWarning": string;
            "60MinutesDurationWarning": string;
            "ApplyButton": string;
            "CustomMode": string;
            "CustomTimeRange": string;
            "Day": string;
            "Days": string;
            "DurationLabel": string;
            "EndLabel": string;
            "FutureDateWarning": string;
            "Hour": string;
            "Hours": string;
            "Last10080MinutesOption": string;
            "Last10MinutesOption": string;
            "Last1440MinutesOption": string;
            "Last20MinutesOption": string;
            "Last30MinutesOption": string;
            "Last360MinutesOption": string;
            "Last43200MinutesOption": string;
            "Last60MinutesOption": string;
            "Minute": string;
            "Minutes": string;
            "RelativeMode": string;
            "StartDurationMode": string;
            "StartEndMode": string;
            "StartLabel": string;
            "TimeFilter": string;
            "TimeValueLabel": string;
            "To": string;
            "Today": string;
        };
        static getResources(): {
            "1MillisecondDurationWarning": string;
            "60MinutesDurationWarning": string;
            "ApplyButton": string;
            "CustomMode": string;
            "CustomTimeRange": string;
            "Day": string;
            "Days": string;
            "DurationLabel": string;
            "EndLabel": string;
            "FutureDateWarning": string;
            "Hour": string;
            "Hours": string;
            "Last10080MinutesOption": string;
            "Last10MinutesOption": string;
            "Last1440MinutesOption": string;
            "Last20MinutesOption": string;
            "Last30MinutesOption": string;
            "Last360MinutesOption": string;
            "Last43200MinutesOption": string;
            "Last60MinutesOption": string;
            "Minute": string;
            "Minutes": string;
            "RelativeMode": string;
            "StartDurationMode": string;
            "StartEndMode": string;
            "StartLabel": string;
            "TimeFilter": string;
            "TimeValueLabel": string;
            "To": string;
            "Today": string;
        };
    }
}

declare module DependencyMap {
    class TimeIntervalSelectorTemplate {
        static template: string;
    }
}


/// <reference types="knockout" />
declare module DependencyMap {
    class AdmToolbar {
        TIME_INTERVAL_DURATION_LIMIT: number;
        afterBound: Function;
        selectedEntity: DependencyMap.IArmEntity;
        loadState: KnockoutObservable<LoadState>;
        mapContext: KnockoutObservable<MapContext>;
        allowFutureDates: KnockoutObservable<boolean>;
        durationLimit: KnockoutObservable<number>;
        minimumDuration: KnockoutObservable<number>;
        relativeDurations: KnockoutObservableArray<number>;
        timeInterval: KnockoutObservable<TimeInterval>;
        timeControls: TimeIntervalSelectorV3;
        private Strings;
        private popupManager;
        private defaultTimeRequestPending;
        constructor($element: JQuery, options?: any);
        private applyDefaultTimeInterval();
        private configurePopupManager(observable, element);
    }
}

declare module DependencyMap {
    class AdmToolbarResources {
        static resources: {
            "TimeControlHeader": string;
        };
        static getResources(): {
            "TimeControlHeader": string;
        };
    }
}

declare module DependencyMap {
    class AdmToolbarTemplate {
        static template: string;
    }
}


declare module DependencyMap {
    class AdmAlertsManager {
        static readonly NAME: string;
        addNodeBadges: (badges: Integrations.MapBadge[]) => void;
        constructor();
        static addAlertBadges(data: DependencyMap.Kusto.IKustoQueryResponse, machineNameIdMap?: StringMap<string>): void;
        static generateQuery(localStartTime: Date, localEndTime: Date): string;
        static generateQueryInSearchBlade(alertRuleInstanceId: string): string;
        static convertKustoResultToAlerts(data: DependencyMap.Kusto.IKustoQueryResponse): {
            [id: string]: Integrations.IAlert[];
        };
        private static formatDate;
        private static convertToBadge(machineAlertsMap, machineNameIdMap?);
        private static getSeverityLevel(alert);
    }
}

declare module DependencyMap {
    enum OverallHealth {
        CRITICAL = 5,
        WARNING = 4,
        HEALTHY = 3,
        UNKNOWN = 1,
        LOADING = 0,
    }
    /**
     * Utility methods for displaying VM health information on the map
     */
    class AdmHealthManager {
        static readonly NAME: string;
        constructor();
        /**
         * Add health emphasis on machine that matches the ARM ID
         *
         * @param health Overall health state
         * @param resourceId
         */
        static addHealthEmphasis(health: any, resourceId: string): void;
        private static addNodeBadges(badges);
        private static getMachineNode(resourceId);
        private static getHealthEmphasis(health);
    }
}

declare module DependencyMap {
    class AdmLogEventsManager {
        static NAME: string;
        static convertKustoResponseToLogEvents(data: any): Integrations.ILogEvents[];
        static generateQuery(machineName: string, localStartTime: Date, localEndTime: Date): string;
        static generateQueryInSearchBlade(logEvent: Integrations.ILogEvents, computerName: string): string;
    }
}

/**
 * Tracer which traces all basic logs into console.
 */
declare module DependencyMap {
    interface GlobalContext {
        workspace: string;
        compute_id?: string;
        computer_group_id?: string;
    }
    /**
     * Any application which uses this map library will pass telemetry provider that implements the ITelemetry interface.
     */
    interface ITelemetry {
        trackException: (exception: object | string, source: string, properties: StringMap<any>) => void;
        trackEvent: (eventName: string, properties: StringMap<any>) => void;
        trackDependency: (id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number) => void;
        notifyClient: (title: string, message: string, level: NotificationStatus) => void;
    }
    /**
     * From MsPortalFx.Hubs.Notifications.NotificationStatus
     */
    enum NotificationStatus {
        Information = 0,
        Warning = 1,
        Error = 2,
        InProgress = 3,
        Success = 4,
    }
    /**
     * Below operations are used as keys to track sequence of steps triggered as part of a single user operation.
     * An operation can consist of one or more actions.
     * For example, "generateMap" operation contains "processData", "layoutComputation" and "rendering" actions.
     */
    class TelemetryOperations {
        /**
            GenerateMap operation tracks the processing of raw json, graph creation, layout computation and rendering
        */
        static readonly GenerateMap: string;
        /**
            GetCoarseMap tracks the API operation to get the coarse map details.
        */
        static readonly GetCoarseMap: string;
        /**
            GetMachineDetails tracks API operation to get process level details of a machine.
        */
        static readonly GetMachineDetails: string;
        /**
            GetClientGroupMembers tracks API operation to get clientgroup members of a clientgroup.
        */
        static readonly GetClientGroupMembers: string;
        /**
            GetServerGroupMembers tracks API operation to get servergroup members of a servergroup.
        */
        static readonly GetServerGroupMembers: string;
        /**
         * LoadServerMap tracks user operation whenever user wants to load specific clientgroup member or
         * or server group member's map.
        */
        static readonly LoadServerMap: string;
        /**
         * ToggleSelfLinks tracks user operation whenver user wants to see self links of a specific machine.
        */
        static readonly ToggleSelfLinks: string;
        /**
         * OpenLegend tracks user operation whenver user Open Legend.
        */
        static readonly OpenLegend: string;
        /**
         * CloseLegend tracks user operation whenver user close Legend.
        */
        static readonly CloseLegend: string;
        /**
         * ContextMenu tracks user operation whenver user click ContextMenu.
        */
        static readonly ContextMenu: string;
        /**
         * Tracks user operation whenver user Toggle Process Filter.
        */
        static readonly ToggleProcessFilter: string;
        /**
         * ExpandAllNodes operation tracks user operation whenever user clicks "ExpandAll" button.
        */
        static readonly ExpandAllNodes: string;
        /**
         * NavigateToHelpPage operation tracks user operation whenever user clicks Help icon on the control bar.
        */
        static readonly NavigateToHelpPage: string;
        /**
         * CollapseAllNodes operation tracks user operation whenever user clicks "CollapseAll" button.
        */
        static readonly CollapseAllNodes: string;
        /**
         * Alerts operation tracks actions associated to alerts management like alerts query generation, API call to get alerts, processing them, ...etc.
         */
        static readonly Alerts: string;
        /**
         * LogEvents operation tracks actions associated to logevents management like logevents query generation, API call to get logevents, processing them, ...etc.
         */
        static readonly LogEvents: string;
        /**
         * This operation tracks when user clicks the Expand-Group context menu item of Group node.
         */
        static readonly ViewDetailedGroupMap: string;
    }
    /**
     * Below UserActions are used as keys to track duration of each user action.
     * It includes getting data from API, processing in client and rendering the map.
     * These values give true responsive time that user is experiencing for each and every given user action.
     */
    class TelemetryUserActions {
        static readonly LoadMap: string;
        static readonly ExpandClientGroup: string;
        static readonly ExpandServerGroup: string;
        static readonly ExpandMachine: string;
    }
    class TelemetryProvider {
        private static TRACE_CONSOLE;
        private static events;
        private static sequenceNumber;
        private static userActionTelemetry;
        static telemetry: ITelemetry;
        static globalContext: GlobalContext;
        static appInsights: any;
        /**
         * Logs Informative messages like number of nodes, number of connections... etc.
         * @param message: Debug message
         * @param source: source component name
         * @param action: Action being performed in the source component
         * @param properties: Custom properties
         * @param parentId
         */
        static info(message: string, source: string, action: string, properties?: any, parentId?: string): void;
        static warn(message: string, source: string, action: string, properties?: any, parentId?: string): void;
        /**
         * Logs any errors or exceptions
         * @param error: Error object
         * @param source: Source component which triggered the error
         * @param action: Action name in which the error occured
         * @param operation: Name of the operation that user is performing. Like expanding a clientgroup
         * @param properties
         */
        static error(error: object | string, source: string, action: string, operation?: string, properties?: object): void;
        static startTracking(operation: string, source: string, level?: TraceLevel): string;
        static stopTracking(operation: string, properties?: Object, traceLevel?: TraceLevel): void;
        static isTracking(operation: any): boolean;
        static discardTracking(operation: any): void;
        static trackStep(operation: string, stepName: string, message?: string): void;
        static stopAllOperationTrackings(): void;
        /**
         * Start tracking the userAction for telemetry
         * @param userAction UserAction name
         */
        static startTrackingUserAction(userAction: string, source: string, correlationId: string, properties?: any): void;
        /**
         * Tracks the intermediate steps for a given user action
         * @param stepName
         */
        static trackUserAction(telemetryStep: TelemetryStep): void;
        /**
         * Logs the duration of the userAction into telemetry provider.
         */
        static stopTrackingUserAction(success: boolean, apiStatusCode?: number, error?: any): void;
        /**
         * Transmits client notification to the user, depends on MapProvider implementation
         *
         * @param title     Client notification title
         * @param message   Client notification message body
         * @param level     Client notification level (e.g. Error, Information, etc.)
         */
        static notifyClient(title: string, message: string, level: NotificationStatus): void;
        /**
         * This method is used to trace logs if the operation is dependent on any external components.
         * UX is dependent on APIs. So any user actions which involve API operations will be traced here.
         */
        protected static traceDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number): void;
        protected static trace(message: string, level: TraceLevel, source: string, action: string, properties: any, parentId: string): void;
        private static traceTelemetryEvent(message, level, source, action, properties);
        static convertTypeToString(type: EntityType): "Machine" | "Connection" | "Process" | "Port" | "Acceptor" | "ClientGroup" | "ClientGroupMember" | "ServerGroup" | "MachineWithHints" | "MachineGroup" | "ProcessGroup" | "UnconnectedProcessGroup" | "AggregatedConnection" | "NewClientGroup" | "NewServerGroup" | "ClientOrServerGroupMember" | "Unknown";
        /**
            * Shim the object we are handed with toJSON incase there are no enumerable items
            * we want all own properties to appear in the final json
            * Error has no enumerable properties...
            * @param data data we are shimming
            * @returns {void}
        */
        private static shimCustomObject(data);
    }
}

/**
 * Factory class to create portal view models from Api responses
 */
declare module DependencyMap {
    class AdmViewModelFactory {
        static ARM_SKIP_TOKEN_PARAM: string;
        static createFromArmEntity(entity: Api.v2.ArmResource): IArmEntity;
        static getArmEntityId(entity: Api.v2.ArmResource): string;
        static getArmEntityType(entity: Api.v2.ArmResource): EntityType;
        static getArmSkipToken(nextLink: string): string;
        static isNodeMonitored(monitoringState: any): boolean;
        static getParameterByName(name: any, url: any): string;
        static deepCopyAllProperties(source: any, target: any): void;
    }
    abstract class Entity implements IEntity {
        id: string;
        type: EntityType;
        constructor(id: string, type: EntityType);
    }
    abstract class ArmEntity extends Entity implements IArmEntity {
        armName: string;
        armId: string;
        etag: string;
        constructor(id: string, entity: Api.v2.ArmResource, type: EntityType);
        toApi(): Api.v2.ArmResource;
    }
    abstract class MapEntity extends Entity implements IMapEntity {
        isVisible: boolean;
        isInLayout: boolean;
        constructor(id: string, type: EntityType);
    }
    abstract class MapNode extends MapEntity implements IMapNode {
        displayName: string;
        isMonitored: boolean;
        isHighlighted: boolean;
        selfLinksVisible: boolean;
        loadServerMapEnabled: boolean;
        inboundConnections: IConnection[];
        outboundConnections: IConnection[];
        inboundSelfConnections: IConnection[];
        outboundSelfConnections: IConnection[];
        failedConnections: IConnection[];
        clientNodes: EntityTypeMap<{
            [id: string]: IMapNode;
        }>;
        serverNodes: EntityTypeMap<{
            [id: string]: IMapNode;
        }>;
        badges: Integrations.MapBadge[];
        maxBadgeEmphasis: EmphasisType;
        constructor(id: string, type: EntityType);
        addConnection(connection: IConnection, isInbound: boolean, isFailed: boolean, isSelfConnection: boolean): void;
        addConnectedNode(node: IMapNode, isClient: boolean): void;
    }
    abstract class MapEdge extends MapEntity implements IMapEdge {
        constructor(id: string, type: EntityType);
    }
    abstract class ArmMapNode extends MapNode implements IArmEntity {
        armName: string;
        armId: string;
        constructor(id: string, entity: Api.v2.ArmResource, type: EntityType);
        toApi(): Api.v2.ArmResource;
    }
    abstract class ArmMapEdge extends MapEdge implements IArmEntity {
        armName: string;
        armId: string;
        constructor(id: string, type: EntityType);
        toApi(): Api.v2.ArmResource;
    }
    class Machine extends ArmMapNode implements IMachine {
        computerName: string;
        fullyQualifiedDomainName: string;
        bootTime: string;
        virtualizationState: string;
        virtualMachine: VirtualMachineConfiguration;
        hypervisor: HypervisorConfiguration;
        networking: NetworkConfiguration;
        agent: AgentConfiguration;
        resources: MachineResourcesConfiguration;
        operatingSystem: OperatingSystemConfiguration;
        timezone: TimeZoneInfo;
        expanded: boolean;
        roleCounts: {
            [role: number]: number;
        };
        processGroups: IProcessGroup[];
        processes: IProcess[];
        clientGroup: IClientGroup;
        operatingSystemType: OperatingSystemFamilyType;
        hosting: HostingConfiguration;
        NAME: string;
        private _processCount;
        constructor(id: string, entity: Api.v2.Machine);
        processCount: number;
        getConnectedServerCount(): number;
        getConnectedClientCount(): number;
        static createFromHints(id: string, entity: Api.v2.MachineHint): Machine;
        static osFamilyToFamilyType(family: string): OperatingSystemFamilyType;
        static ipInterfaceToCidrNotation(ipInterface: IPv4Interface): string;
        static cloudServiceTypeFromString(roleType: string): AzureCloudServiceRoleType;
        updateProperties(entity: Api.v2.Machine): void;
        addProcessGroup(processGroup: IProcessGroup): void;
        addProcess(process: IProcess): void;
        getAllIpAddresses(): string[];
        getHealth(): GroupMemberHealthState;
    }
    class MachineStub extends ArmEntity implements IMachineStub {
        displayName: string;
        osFamilyType: OperatingSystemFamilyType;
        live: boolean;
        constructor(id: string, entity: Api.v2.MachineHint);
        static createFromMachine(machine: IMachine): IMachineStub;
        toApi(): Api.v2.MachineHint;
    }
    class MachineGroup extends ArmEntity implements IMachineGroup {
        displayName: string;
        groupType: MachineGroupType;
        machines: IMachineStub[];
        constructor(id: string, entity: Api.v2.MachineGroup);
        toApi(): Api.v2.MachineGroup;
        addMachines(machines: IMachine[]): void;
        private getMachineGroupTypeFromString(groupTypeStr);
    }
    class ProcessGroup extends ArmMapNode implements IProcessGroup {
        processes: IProcess[];
        machineId: string;
        clientGroup?: IClientGroup;
        constructor(id: string, entity: any);
        addProcess(process: IProcess): void;
    }
    class Process extends ArmMapNode implements IProcess {
        executableName: string;
        machineId: string;
        startTime: string;
        details: ProcessDetails;
        user: ProcessUser;
        acceptorOfId: string;
        clientOfId: string;
        role: EntityRoleType;
        group: string;
        ports: IPort[];
        processGroupId: string;
        processGroup: IProcessGroup;
        clientGroup: IClientGroup;
        constructor(id: string, entity: Api.v2.Process);
        addPort(port: IPort): void;
        getPortNumbers(): string[];
        static getProcessRoleType(role: string): EntityRoleType;
    }
    class Port extends ArmEntity implements IPort {
        displayName: string;
        isMonitored: boolean;
        machineId: string;
        ipAddress: string;
        portNumber: number;
        constructor(id: string, entity: Api.v2.Port);
    }
    class ClientGroup extends ArmMapNode implements IClientGroup {
        destinationId: string;
        destination: IMapNode;
        memberCount: number;
        isApproximate: boolean;
        unmonitoredMemberCount: number;
        members: IClientGroupMember[];
        unmonitoredMembers: IClientGroupMember[];
        membersSkipToken: string;
        constructor(id: string, entity: Api.v2.ClientGroup);
        setDestinationEntity(destinationEntity: IMapNode): void;
        updateCount(memberCount: Api.v2.ClientGroupMemberCount): void;
        updateMembers(membersCollection: Api.v2.ClientGroupMembersCollection, mapModel: IMap): void;
        getNodeDisplayName(labelSingular: string, labelPlural: string): string;
    }
    class ClientGroupMember extends ArmEntity implements IClientGroupMember {
        ipAddress: string;
        portId: string;
        portNumber: number;
        processIds: string[];
        machine: IMachine;
        constructor(id: string, member: Api.v2.ClientGroupMember);
    }
    class ServerGroup extends MapNode implements IServerGroup {
        memberViewModels: IMachine[];
        port: IPort;
        role: EntityRoleType;
        constructor(id: string, port: IPort);
        addMember(machine: IMachine): void;
        getNodeSubheader(labelPlural: string): string;
    }
    class GroupMemberConnectionEndpoint implements IGroupMemberConnectionEndpoint {
        machineName: string;
        processName: string;
        process: IProcess;
        isMonitored: boolean;
        constructor(entity: Api.v3.GroupMemberConnectionEndpoint);
    }
    class GroupMemberConnectionInfo implements IGroupMemberConnectionInfo {
        failureState: ConnectionFailureState;
        serverPort: number;
        source: GroupMemberConnectionEndpoint;
        destination: GroupMemberConnectionEndpoint;
        constructor(entity: Api.v3.GroupMemberConnectionInfo);
    }
    abstract class ClientOrServerGroupMemberMachine extends ArmMapNode implements IClientOrServerGroupMemberMachine {
        displayName: string;
        connectionFailureState: ConnectionFailureState;
        group: GroupViewModelV3;
        connectionInfos: GroupMemberConnectionInfo[];
        machineId: string;
        machine: Machine;
        operatingSystemType: OperatingSystemFamilyType;
        constructor(id: string, entity: Api.v3.ClientOrServerGroupMember, entityType: EntityType);
        updateProperties(entity: Api.v3.ClientOrServerGroupMember): void;
        getHealth(): GroupMemberHealthState;
    }
    /**
    ClientGroup member type in new API contract.
     */
    class ClientGroupMemberMachine extends ClientOrServerGroupMemberMachine {
        constructor(id: string, entity: Api.v3.ClientOrServerGroupMember);
    }
    /**
    ServerGroup member type in new API contract.
     */
    class ServerGroupMemberMachine extends ClientOrServerGroupMemberMachine {
        constructor(id: string, entity: Api.v3.ClientOrServerGroupMember);
    }
    abstract class PageableGroupNodeViewModel extends ArmMapNode {
        graphNode: GraphNode;
        filteredMemberCount: number;
        currentPageNumber: number;
        memberCountPerPage: number;
        monitoredMemberSummaryCount: number;
        discoveredMemberSummaryCount: number;
        isDiscoveredMemberCountEstimated: boolean;
        currentHealthStateFilter: GroupMemberHealthState;
        protected _allMemberGraphNodes: {
            [key: number]: GraphNode;
        };
        protected _filteredMemberGraphNodes: {
            [key: number]: GraphNode;
        };
        constructor(id: string, entity: Api.v2.ArmResource, type: EntityType);
        addGroupMemberGraphNode(memberGraphNode: GraphNode, index: number): void;
        getMonitoredMemberCount(): number;
        getDiscoveredMemberCount(): number;
        getTotalMemberCount(): number;
        getTotalPageCount(): number;
        moveToNextPage(): void;
        moveToPrevPage(): void;
        protected markCurrentPageMembersAsVisible(): void;
        clearFilter(): void;
    }
    abstract class GroupViewModelV3 extends PageableGroupNodeViewModel implements IGroupViewModelV3 {
        monitoredMemberMachines: StringMap<Machine>;
        allGroupMembers: IClientOrServerGroupMemberMachine[];
        role: EntityRoleType;
        name: string;
        constructor(id: string, entity: Api.v2.ArmResource, type: EntityType);
        getCriticalMemberCount(): number;
        getWarningMemberCount(): number;
        getFilteredMemberIds(onlyMonitoredMachines?: boolean): string[];
        getNodeSubheader(labelPlural: string): string;
        addMemberBadge(badge: Integrations.MapBadge): void;
        applyFilter(healthState: GroupMemberHealthState): void;
        getFilteredClientSummaryText(): string;
        private _getFilteredMemberCount(healthFilter);
    }
    class ServerGroupViewModelV3 extends GroupViewModelV3 implements IServerGroupViewModelV3 {
        /**
        List of machines/processgroups/processes which have outgoing connections to this serverGroup
        */
        clientEntities: StringMap<IEntity>;
        /**
         * List of client graphNodes of this ServerGroup
         */
        clientGraphNodes: StringMap<GraphNode>;
        portNumber: number;
        constructor(id: string, serverGroup: Api.v3.ServerGroup);
        addClient(entity: IEntity): void;
        addClientEntityGraphNode(graphNode: GraphNode): void;
        setGraphNodeVisibility(value: boolean): void;
        getGraphNodeVisibility(): boolean;
        /**
         * Graph layout algorithm need to calculate the visibility of the serverGroup based on the
         * the visibility of dependants of this serverGroup
         */
        isServerGroupVisible(): boolean;
    }
    class ClientGroupViewModelV3 extends GroupViewModelV3 implements IClientGroupViewModelV3 {
        destinationId: string;
        destination: IMapNode;
        constructor(id: string, clientGroup: Api.v3.ClientGroup);
        setDestinationEntity(destinationEntity: IMapNode): void;
    }
    class VirtualGroupNodeViewModel extends PageableGroupNodeViewModel implements IVirtualGroupNode {
        machines: Machine[];
        totalMachineCount: number;
        currentHealthStateFilter: GroupMemberHealthState;
        constructor(id: string, displayName: string, machines: Machine[]);
        getCriticalMemberCount(): number;
        applyFilter(healthState: GroupMemberHealthState): void;
    }
    class AllServerPortGroupsVirtualNodeViewModel implements IAllServerPortGroupsVirtualNodeViewModel {
        type: EntityType;
        id: string;
        isInLayout: boolean;
        isVisible: boolean;
        allServerPortGroups: IServerGroupViewModelV3[];
        displayName: string;
        constructor(serverGroups: IServerGroupViewModelV3[]);
    }
    class AggConnection extends ArmMapEdge implements IAggConnection {
        clients: string[];
        servers: string[];
        connections: IConnection[];
        portIds?: string[];
        displayName: string;
        failureState: ConnectionFailureState;
        connectionCount: number;
        constructor(id: string, connection: Api.v2.AggConnection);
    }
    class ClientGroupMemberVirtualConnection extends ArmMapEdge implements IClientGroupMemberVirtualConnection {
        source: string;
        destination: string;
        failureState: ConnectionFailureState;
        clientGroupMember: IClientOrServerGroupMemberMachine;
        destinationNode: IMapNode;
        constructor(id: string, clientGroupMember: ClientGroupMemberMachine, targetNode: IMapNode);
    }
    class ServerGroupMemberVirtualConnection extends ArmMapEdge implements IServerGroupMemberVirtualConnection {
        source: string;
        destination: string;
        failureState: ConnectionFailureState;
        serverGroupMember: IClientOrServerGroupMemberMachine;
        sourceNode: IMapNode;
        constructor(id: string, sourceNode: IMapNode, serverGroupMember: ServerGroupMemberMachine);
    }
    /**
     * A virtual connection between monitored machine/group to allServerPortGroupsVirtual node
     */
    class AllServerPortGroupsVirtualConnection extends ArmMapEdge implements IConnection {
        sourceNode: IMapNode;
        destNode: AllServerPortGroupsVirtualNodeViewModel;
        source: string;
        destination: string;
        failureState: ConnectionFailureState;
        displayName: string;
        isSelfLink: boolean;
        forceVisible: boolean;
        isFailedConnection: boolean;
        constructor(id: string, sourceNode: IMapNode, destNode: AllServerPortGroupsVirtualNodeViewModel);
    }
    class Connection extends ArmMapEdge implements IConnection {
        source: string;
        destination: string;
        serverPort: string;
        failureState: ConnectionFailureState;
        isSelfLink: boolean;
        displayName: string;
        isFailedConnection: boolean;
        constructor(id: string, connection: Api.v2.Connection);
        static getFailureState(failureState: string): ConnectionFailureState;
    }
    class Acceptor extends ArmEntity implements IAcceptor {
        source: string;
        destination: string;
        constructor(id: string, acceptor: Api.v2.Acceptor);
    }
}

/**
This module has helper functions to make ajax calls.
 */
declare module DependencyMap.ApiDataProvider {
    function getCoarseMapData(requestDesciptor: object, telemetryCorrelationId: string): any;
    function getDetailedMachineMap(requestDesciptor: object, telemetryCorrelationId: string): any;
    function getClientGroupMembers(requestDesciptor: object, telemetryCorrelationId: string): any;
    function getServerGroupMembers(requestDesciptor: object, telemetryCorrelationId: string): any;
}

declare module DependencyMap {
    class KustoUtils {
        static GetQueryResultObjects(kustoQueryResponse: DependencyMap.Kusto.IKustoQueryResponse, excludeNulls?: boolean, tableIndex?: number): any[];
        static convertKustoResultsToObjects(rows: any[], columns: DependencyMap.Kusto.ISearchV2ResultTableColumn[], excludeNulls: boolean): any[];
    }
}


/// <reference types="q" />
/// <reference types="knockout" />
declare module DependencyMap {
    interface IMapApiDataProvider {
        /**
        * the start time of the monitor stage
        */
        startDateTimeUtc: Date;
        /**
        * the end time of the monitor stage
        */
        endDateTimeUtc: Date;
        /**
         * this callback is optional.
         * it will query the alerts and logEvent.
         */
        executeQuery?: (query: string) => Q.Promise<DependencyMap.Kusto.IKustoQueryResponse>;
        /**
         * This callback is used to get the coarsMap.
         * ajax call will be triggered within the callback.
         * This method is not suggested since ajax failures may not be stored in telemetry.
         * 'getCoarseMapRequestDescriptor' is recommended as an alternative to this method.
         */
        requestCoarseMap?: () => Q.Promise<DependencyMap.Api.v3.MapResponse>;
        /**
         * This callback is used to get the specific client group details.
         * ajax call will be triggered within the callback.
         * This method is not suggested since ajax failures may not be stored in telemetry.
         * 'getClientGroupDetailsRequestDescriptor' is recommended as an alternative to this method.
         */
        requestClientGroupDetails?: (id: string) => Q.Promise<DependencyMap.Api.v3.ClientOrServerGroupMachineMap>;
        /**
         * This callback is used to get the specific server group details.
         * ajax call will be triggered within the callback.
         * This method is not suggested since ajax failures may not be stored in telemetry.
         * 'getServerGroupDetailsRequestDescriptor' is recommended as an alternative to this method.
         */
        requestServerGroupDetails?: (id: string) => Q.Promise<DependencyMap.Api.v3.ClientOrServerGroupMachineMap>;
        /**
         * This callback is used to get the specific machine details.
         * ajax call will be triggered within the callback.
         * This method is not suggested since ajax failures may not be stored in telemetry.
         * 'getMachineDetailsRequestDescriptor' is recommended as an alternative to this method.
         */
        requestMachineDetails?: (id: string) => Q.Promise<DependencyMap.Api.v3.MapResponse>;
        /**
         * Below callback is called whenever user wants to load a specific {client/server}group member's map
         * by clicking 'loadServerMap' context menu item.
         */
        onMapIdUpdated?: (id: string) => void;
        /**
         * This callback is called to get the http request descriptor which is used to make REST call
         * to get the map of a computer or computer group.
         * The return object looks like
         * {
         *   contentType: 'application/json',
         *   headers: { Authorization: "" },
         *   timeout: queryTimeoutMs,
         *   type: 'GET',
         *   url: queryUrl,
         * }
         */
        getCoarseMapRequestDescriptor?: (id?: string) => object;
        /**
         * This callback is called to get the http request desciptor which is used to make REST call
         * to get details of sepcific client group.
         */
        getClientGroupDetailsRequestDescriptor?: (clientGroupId: string) => object;
        /**
         * This callback is called to get the http request desciptor which is used to make REST call
         * to get details of sepcific server group.
         */
        getServerGroupDetailsRequestDescriptor?: (serverGroupId: string) => object;
        /**
         * This callback is called to get the http request desciptor which is used to make REST call
         * to get details of sepcific machine.
         */
        getMachineDetailsRequestDescriptor?: (machineId: string, getFullMap?: boolean) => object;
        /**
         * This callback is called whenever map is rendered.
         */
        onMapRendered?: () => void;
    }
    interface DependencyMapDashBoardOptions {
        /**
        * Map Image relative path, to use default path, put admmap.js same level with images folder.
        * Default path is 'images/map/'.
        */
        mapImagesRelativePath?: string;
        /**
        * Show properties Panel when entity been selected, currently the property panel only support v2 version map.
        * For some new entity in large scale map (v3), the property panel is empty.
        */
        enablePropertiesPanel?: boolean;
        /**
        * Enable Edge Selection
        */
        enableEdgeSelection?: boolean;
        /**
        * Enable Time Control, used by AMP team
        */
        enableTimeControl?: boolean;
        /**
        * among with the enableTimeControl
        */
        timeControlImagesRelativePath?: string;
        /**
        * pass in logger.
        */
        telemetryListener: ITelemetry;
        /**
        * please indicate one from the array, default is English.
        * ['cs', 'de', 'es', 'fr', 'hu', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-br', 'pt-pt', 'ru', 'sv', 'tr', 'zh-hans', 'zh-hant']
        */
        language?: string;
        /**
        * Only need for (v3) large scale map. plesae implement the IMapApiDataProvider
        */
        mapApiDataProvider?: IMapApiDataProvider;
        onSelectionUpdated?: (newSelection: SelectionContext) => void;
        enableSimpleMapLayout?: boolean;
    }
    class AdmWorkspace {
        private static map;
        mapComponentLoadEvent: KnockoutObservable<any>;
        showPanel: KnockoutObservable<boolean>;
        private toolbar;
        private propertiesPanel;
        constructor(domElementId: string, options: DependencyMapDashBoardOptions);
        static getMapInstance(): AdmMap;
        static selectEntityByResourceId(resourceId: string): void;
        initializeDependencyMap(data: DependencyMap.Api.v2.Data, options?: any): void;
        initializeDependencyMapV3(data?: Api.v3.MapResponse, options?: DependencyMapOptions): Promise<any>;
        clearMap(): void;
        assignCustomizedProperties(customizedProperties: DependencyMap.Api.v2.CustomizedProperty[]): void;
        updateClientGroupMemberCollection(clientGroupMemberCollection: DependencyMap.Api.v2.ClientGroupMembersCollection[]): void;
        setMapState(mapState: DependencyMap.LoadState): void;
        updateServerPortsVisibility(portIds: string[]): void;
        /**
         * This method sets simple layout algortihm to use.
         * @memberof AdmWorkspace
         */
        enableSimpleMapLayout(): void;
        zoomToFit(): void;
        handleErrorCode(errorCode: ErrorCode): void;
    }
}

declare module DependencyMap {
}

declare module DependencyMap {
    class AdmWorkspaceTemplate {
        static template: string;
    }
}



// extend the canvas api 
interface CanvasRenderingContext2D {
    roundedRect(x: number, y: number, width: number, height: number,
        cornerRadius: number, borderWidth: number,
        fillColor: string, borderColor: string, shadowColor?: string): void;
    dashedLine(x1: number, y1: number, x2: number, y2: number, dashLen: number): void;
    arrowLine(x1: number, y1: number, x2: number, y2: number, which: number, angle: number, d: number): void;
    drawArrowHead(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
}

interface JQueryEventObject {
    tapCount?: number;
    deltaX?: number;
    deltaY?: number;
    pointers: any;
}

interface JQuery {
    getBoundingClientRect(): any;
    mousewheel: any;
    unmousewheel: any;
}

/**
 * Adm view models schemas 
 */
declare module DependencyMap {

    const enum MapType {
        groupMap = "groupMap",
        singleVmMap = "singleVmMap"
    }

    const enum MachineListMode {
        Uninitialized = 0,
        Machines = 1,
        MachineGroups = 2,
    }

    const enum OverviewTileState {
        Uninitialized = 0,
        Configure = 1,
        Overview = 2,
        Error = 3,
    }

    const enum LoadState {
        // if you change numbering, check knockout bindings!
        Complete = 0,   // finished loading successfully
        Initialized = 1, // component loaded 
        Load = 2,       // api data request 
        Error = 3,      // finished with error
        Empty = 4,      // finished with empty result      

        // mapping/graph component states 
        SetModel = 5,   // populate graph model 
        Reconcile = 6,  // model processing performed before layout
        Layout = 7,     // graph layout
        Render = 8,      // updating DOM
    }

    const enum EntityType {
        Machine = 0,
        Process = 1,
        Port = 2,
        Connection = 3,
        Acceptor = 4,
        ClientGroup = 5,
        ClientGroupMember = 6,
        ServerGroup = 7,
        MachineStub = 8,
        MachineGroup = 9,
        ProcessGroup = 10,
        UnconnectedProcesses = 11,
        AggConnection = 12,
        ClientGroupV3 = 13,
        ServerGroupV3 = 14,
        ClientOrServerGroupMember =15,
        ClientGroupMemberMachine = 16, // Machine node within clientGroup or ServerGroup
        ServerGroupMemberMachine = 17,

        /**
        This type is used to represent connection between clientGroupMember and the target (machine/processgroup/process).
        API or graphStore does not have any idea on this connection. This is pure virtual connection created by UX
        to get its connection metrics.
         */
        ClientGroupMemberVirtualConnection = 18,

        /**
        This type is used to represent connection between machine/processgroup/process and serverGroupMember.
        API or graphStore does not have any idea on this connection. This is pure virtual connection created by UX
        to get its connection metrics.
         */
        ServerGroupMemberVirtualConnection = 19,

        /**
         * This is a virtual node represents group as a single node.
         * Members of this node are machines.
         */
        VirtualGroupNode = 20,

        /**
         * This node represents all serverPort groups.
         * This node cannot be expanded but when user opens properties panel,
         * Then we list all serverPorts in the properties panel
         */
        AllPortsNode = 21,

        /**
         * A dummy connection type whose source is a monitored machine/group
         * and target is AllPortsNode
         */
        AllServerPortGroupsVirtualConnection = 22
    }

    // Each group member health can be critical or warning or nominal or unmonitored.
    const enum GroupMemberHealthState {
        Unknown = "Unknown",
        Nominal = "Nominal",
        Warning = "Warning",
        Critical = "Critical",
        None = "None"
    }

    const enum MachineGroupType {
        CloudService = 0,
        ServiceFabric = 1,
        ScaleSet = 2,
        Static = 3
    }

    // Generic map of entity type to type T
    export type EntityTypeMap<T> = { [entityType: number]: T };

    const enum EntityRoleType {
        Custom = -1,
        None = 0,
        WebServer = 1,
        AppServer = 2,
        DatabaseServer = 3,
        LdapServer = 4,
        SmbServer = 5,
    }

    // An element we visualize or otherwise represent in the dashboard
    interface IEntity {
        id: string;
        type: EntityType;
    }

    // A uniquely identificable Arm-backed entity
    interface IArmEntity extends IEntity {
        armName: string;    // unique name within arm collection
        armId: string;      // arm path to resource
        etag?: string;

        toApi(): Api.v2.ArmResource;
    }

    // Adm Entities that are visualized in the map as nodes
    interface IMapEntity extends IEntity {
        isVisible: boolean;
        isInLayout: boolean;
    }

    export interface IGridRow extends IArmEntity {
        displayName: string;
        allMissing?: boolean;
        collapsed?: boolean;
        live?: boolean;
        parent?: IGridRow;
    }

    // Entities that are nodes in the map
    interface IMapNode extends IMapEntity {
        displayName: string;
        isMonitored: boolean;
        isHighlighted: boolean;
        selfLinksVisible: boolean;
        loadServerMapEnabled: boolean;

        inboundConnections?: IConnection[]; // All inbound connections including failed and selflinks are present in this array
        outboundConnections?: IConnection[]; // All outbound connections including failed and selflinks are present in this array
        inboundSelfConnections?: IConnection[]; // This is a subset of inboundConnections. This array contains only inbound selfLinks
        outboundSelfConnections?: IConnection[]; // This is a subset of outboundConnections. This array contains only outbound selfLinks
        failedConnections?: IConnection[];
        addConnection(connection: IConnection, isInbound: boolean, isFailed: boolean, isSelfLink: boolean);

        clientNodes: EntityTypeMap<{ [id: string]: IMapNode }>;   // map of entity types to sets of client nodes 
        serverNodes: EntityTypeMap<{ [id: string]: IMapNode }>;   // map of entity types to sets of server nodes
        addConnectedNode(node: IMapNode, isClient: boolean);

        badges: Integrations.MapBadge[];
        maxBadgeEmphasis: EmphasisType;
        customizedProperties?: Api.v2.CustomizedProperty[];
    }

    // Entities that are edges in the map 
    interface IMapEdge extends IMapEntity {
        forceVisible?: boolean;
    }

    interface IMachine extends IMapNode, IArmEntity, IGridRow {
        computerName?: string;
        fullyQualifiedDomainName?: string;
        bootTime?: string;
        virtualizationState?: string;
        virtualMachine?: VirtualMachineConfiguration;
        hypervisor?: HypervisorConfiguration;
        networking?: NetworkConfiguration;
        agent?: AgentConfiguration;
        resources?: MachineResourcesConfiguration;
        operatingSystem?: OperatingSystemConfiguration;
        timezone?: TimeZoneInfo;
        expanded?: boolean;

        roleCounts: { [role: number]: number };      // map of role type to count
        processGroups: IProcessGroup[];
        processes: IProcess[];
        clientGroup?: IClientGroup;

        addProcessGroup(process: IProcessGroup);
        addProcess(process: IProcess);
        getAllIpAddresses(): string[];
    }

    interface IVirtualGroupNode extends IMapNode {
        machines: IMachine[];
        totalMachineCount: number;
        graphNode: GraphNode;
        getCriticalMemberCount(): number;
    }

    interface IGroupMemberConnectionEndpoint {
        machineName: string;
        processName: string;
        process: IProcess;
        isMonitored: boolean;
    }

    interface IGroupMemberConnectionInfo {
        failureState: ConnectionFailureState;
        serverPort: number;
        source: GroupMemberConnectionEndpoint;
        destination: GroupMemberConnectionEndpoint;
    }

    interface IClientOrServerGroupMemberMachine extends IMapNode, IArmEntity, IGridRow {
        computerName?: string;
        fullyQualifiedDomainName?: string;
        operatingSystem?: OperatingSystemConfiguration;
        connectionFailureState?: ConnectionFailureState;
        connectionInfos: IGroupMemberConnectionInfo[];
        machineId: string;
        group: IGroupViewModelV3;
        getHealth(): GroupMemberHealthState;
    }

    interface IProcessGroup extends IMapNode, IGridRow {
        processes: IProcess[];
        clientGroup?: IClientGroup;
        clientOfId?: string;
        machineId: string;

        addProcess(process: IProcess);
    }

    interface IProcess extends IMapNode, IArmEntity {
        executableName: string;
        machineId: string;
        startTime?: string;
        details?: ProcessDetails;
        user?: ProcessUser;
        acceptorOfId?: string;
        clientOfId?: string;
        role: EntityRoleType;
        processGroup: IProcessGroup;
        group?: string; // This is processGroup name
        processGroupId?: string; // TODO: This attribute is not coming from API response.

        ports: IPort[];
        clientGroup?: IClientGroup;

        addPort(port: IPort);
        getPortNumbers(): string[];
    }

    interface IPort extends IArmEntity {
        displayName: string;
        isMonitored: boolean;
        machineId: string;
        ipAddress: string;
        portNumber: number;
    }

    interface IClientGroup extends IMapNode, IArmEntity {
        destinationId: string;
        destination: IMapNode;

        memberCount?: number;
        isApproximate?: boolean;
        unmonitoredMemberCount?: number;
        members?: IClientGroupMember[];
        unmonitoredMembers: IClientGroupMember[];
        membersSkipToken?: string;

        setDestinationEntity(destinationEntity: IMapNode): void;
        updateCount(memberCount: Api.v2.ClientGroupMemberCount): void;
        updateMembers(membersCollection: Api.v2.ClientGroupMembersCollection, mapModel: DependencyMap.IMap): void;
    }

    interface IClientGroupMember extends IArmEntity {
        ipAddress: string;
        portId: string;
        portNumber: number;
        processIds: string[];
        machine?: IMachine;
    }

    interface IGroupViewModelV3 extends IMapNode {
        role: EntityRoleType;
        graphNode: GraphNode;
        allGroupMembers: IClientOrServerGroupMemberMachine[];
        getTotalMemberCount(): number;
        getMonitoredMemberCount(): number;
        getDiscoveredMemberCount(): number;
    }

    interface IClientGroupViewModelV3 extends IGroupViewModelV3 {
        /**
        Target node Id
         */
        destinationId: string;

        /**
        Target node to which this client group belongs to 
         */
        destination: IMapNode;
    }

    interface IServerGroupViewModelV3 extends IGroupViewModelV3 {
        portNumber: number;

        /**
         * List of machines/processgroups/processes which have outgoing connections to this serverGroup
         */
        clientEntities: StringMap<IEntity>;

        addClientEntityGraphNode(graphNode: GraphNode);
        setGraphNodeVisibility(value: boolean);
        getGraphNodeVisibility(): boolean;
    }

    interface IAllServerPortGroupsVirtualNodeViewModel extends IMapEntity {
        allServerPortGroups: IServerGroupViewModelV3[];
        displayName: string;
    }

    interface IGroupViewModel extends IMapNode {
        memberViewModels: IMachine[];
        port: IPort;
        role: EntityRoleType;
    }

    interface IServerGroup extends IGroupViewModel {
    }

    //view model interface
    interface IAggConnection extends IMapEdge, IArmEntity {
        clients: string[];
        servers: string[];
        portIds?: string[];
        connections: IConnection[];
        displayName: string;
        failureState: ConnectionFailureState;
        connectionCount: number;
    }

    interface IClientGroupMemberVirtualConnection extends IMapEdge {
        /**
        MachineId of the clientGroupMember.
        NOTE: This id is not not clientGroupMemberId. connection metrics are available for the machine but not clientgroupmember resource.
         */
        source: string;

        /**
        Id of a machine or processgroup or a process.
         */
        destination: string;

        /**
        Connection failure state.
         */
        failureState: ConnectionFailureState;

        /**
        ClientGroup member object from which the edge needs to be drawn in the graph
         */
        clientGroupMember: IClientOrServerGroupMemberMachine;

        /**
        Machine/Process/ProcessGroup node to which the connection is made.
         */
        destinationNode: IMapNode;
    }

    interface IServerGroupMemberVirtualConnection extends IMapEdge {
        /**
        Id of a machine or processgroup or process.
         */
        source: string;

        /**
        MachineId of the serverGroupMember.
        NOTE: This id is not not serverGroupMemberId. connection metrics are available for the machine but not servergroupmember resource.
         */
        destination: string;

        /**
        Connection failure state.
         */
        failureState: ConnectionFailureState;

        /**
        ServerGroup member object to which the edge needs to be drawn in the graph
         */
        serverGroupMember: IClientOrServerGroupMemberMachine;

        /**
        Machine/Process/ProcessGroup node from which the connection is made.
         */
        sourceNode: IMapNode;
    }

    interface IConnection extends IMapEdge, IArmEntity {
        source: string;
        destination: string;
        serverPort?: string;
        failureState: ConnectionFailureState;
        isSelfLink: boolean;
        displayName: string;
        isFailedConnection: boolean;
    }

    interface IAcceptor extends IArmEntity {
        source: string;
        destination: string;
    }

    interface IMachineGroup extends IArmEntity, IGridRow {
        displayName: string;
        machines: IMachineStub[];
        groupType: MachineGroupType;
        addMachines(machines: IMachine[]);
    }

    interface IMachineStub extends IArmEntity, IGridRow {
        displayName: string;
        osFamilyType: OperatingSystemFamilyType;
        live: boolean;
    }

    interface NetworkConfiguration {
        dnsNames?: string[];
        ipv4Interfaces?: IPv4Interface[];
        ipv6Interfaces?: IPv6Interface[];
        macAddresses?: string[];
        defaultIpv4Gateways?: string[];
    }

    interface IPv4Interface {
        ipAddress: string;
        subnetMask: string;
        cidrNotation: string;
    }

    interface IPv6Interface {
        ipAddress: string;
    }

    interface ApproximatedCount {
        count: number;
        isApproximate: boolean;
    }

    interface TimeZoneInfo {
        fullName: string;
    }

    interface AgentConfiguration {
        agentId: string;
        dependencyAgentId: string;
        dependencyAgentVersion?: string;
        dependencyAgentRevision?: string;
        rebootStatus?: string;
        clockGranularity?: number;
    }

    interface OperatingSystemConfiguration {
        fullName: string;
        familyType: OperatingSystemFamilyType;
        bitness: string;
        name: string;
    }

    const enum OperatingSystemFamilyType {
        Unknown = 0,
        Windows = 1,
        Linux = 2,
        Solaris = 3,
        Aix = 4
    }

    interface MachineResourcesConfiguration {
        physicalMemory: number;
        cpus: number;
        cpuSpeed: number;
        cpuSpeedIsEstimate: boolean;
    }

    interface VirtualMachineConfiguration {
        virtualMachineType: string;
        virtualMachineName?: string;
        nativeMachineId?: string;
        nativeHostMachineId?: string;
    }

    interface HypervisorConfiguration {
        hypervisorType: string;
        nativeHostMachineId?: string;
    }

    interface HostingConfiguration {
        provider: string;
        vmId: string;
        location: string;
        name: string;
        size: string;
        updateDomain: string;
        faultDomain: string;
        subscriptionId: string;
        resourceGroup: string;
        image: ImageConfiguration;
        cloudService: AzureCloudServiceConfiguration;
        vmScaleSet: AzureVmScaleSetConfiguration;
        serviceFabricCluster: AzureServiceFabricClusterConfiguration;
    }

    interface AzureCloudServiceConfiguration {
        name: string;
        instanceId: string;
        deployment: string;
        roleName: string;
        roleType: AzureCloudServiceRoleType;
    }

    const enum AzureCloudServiceRoleType {
        Unknown,
        Worker,
        Web
    }

    interface AzureServiceFabricClusterConfiguration {
        name: string;
        clusterId: string;
    }

    interface AzureVmScaleSetConfiguration {
        name: string;
        instanceId: string;
        deployment: string;
        resourceId: string;
    }

    interface ImageConfiguration {
        offering: string;
        publisher: string;
        sku: string;
        version: string;
    }

    interface ProcessDetails {
        persistentKey: string;
        poolId?: number;
        firstPid?: number;
        description?: string;
        companyName?: string;
        internalName?: string;
        productName?: string;
        productVersion?: string;
        fileVersion?: string;
        commandLine?: string;
        executablePath?: string;
        workingDirectory?: string;
    }

    interface ProcessUser {
        userName: string;
        userDomain?: string;
    }

    const enum ConnectionFailureState {
        Ok = 0,
        Failed = 1,
        Mixed = 2
    }

    export interface IMap {
        entities: { [id: string]: IEntity };  // map of ids to entities (machines, conns, etc.) for fast access
        ips: { [ipAddress: string]: IEntity } // map of ip adresses to machines
        nodes: NodeMap;
        edges: EdgeMap;

        setModel(mapResult: Api.v2.Map, mapContext: MapContext, mapId: string);
        setModelV3(modelResponse: Api.v3.MapResponse, mapContext: MapContext, groupAsSingleNode: boolean);
        getEntityById(entityId): IEntity;
        getMapNodeById(nodeId: string): IMapNode;
        getMachineByConnection(connection: IConnection, getSource: boolean): IMachine;
        setEntityProperty(entityId: string, name: string, value: any);
        addNodeBadge(nodeId: string, badge: Integrations.MapBadge);
        toggleSelfLinks(nodeId: string);
        getClientMachinesCount(entity: Machine | Process | ProcessGroup): ApproximatedCount;
        getServerMachinesCount(entity: Machine | Process | ProcessGroup): ApproximatedCount;
    }

    export interface NodeMap {
        machines: IMachine[];
        processes: IProcess[];
        ports?: IPort[];
        clientGroups?: IClientGroup[];
        serverGroups?: IGroupViewModel[];
        serverGroupsV3?: IServerGroupViewModelV3[];
        clientGroupsV3?: IClientGroupViewModelV3[];
        processGroups?: IProcessGroup[];
        virtaulGroupNode?: IVirtualGroupNode;
        allServerPortGroupsVirtualNode?: IAllServerPortGroupsVirtualNodeViewModel;
        clientOrServerGroupMemberMachines: { [groupId: string]: IClientOrServerGroupMemberMachine[]}; // machineInstances which are part of any client/server group.
    }

    export interface EdgeMap {
        connections: IConnection[];
        acceptors: IAcceptor[];
    }

    const enum MapContextState {
        Okay,
        Empty,
        Missing
    }

    export interface MapContext {
        kind: Api.v2.MapRequestKind;
        state: MapContextState;
        selectedEntity?: Entity;
        name: string; // Name of the group or machine
        timeInterval: any; // CompositionParser.GlobalInterfaces.TimeInterval;
        highlightEntities?: string[];
    }

    export interface SelectionContext {
        /**
         * This is latest selected entity. 
         * @deprecated Please use edge for 'edge' selection and 'nodes' for node selection.
         */
        entity: IMapEntity;

        /**
         * Selected edge entity. Multi edge selection is not allowed and hence this value is always a single object.
         */
        edge: IMapEntity;

        /**
         * List of selected nodes.
         */
        nodes: IMapNode[];

        /**
         * Type badge of being selected. It can be 'alert', 'change tracking', 'update', ... etc
         */
        badgeType?: BadgeType; 
    }

    const enum BadgeType {
        Alert = 'Alert',
        Update = 'Update',
        Health = 'Health'
    }

    export interface GraphEvent {
        name: string;
        properties: any;
    }

    const enum EmphasisType {
        None = 0, //used as an alternative in code meaning no emphasis
        Informational = 1,
        Warning = 2,
        Critical = 3,
    }

    //generic representation of an hash
    export type HashMap<T> = { [key: number]: T;[key: string]: T };

    const enum TraceLevel {
        Debug = 0,
        Info = 1,
        Warn = 2,
        Error = 3,
        Disabled = 10
    }

    interface TelemetryEvent {
        id: string;
        parentId?: string;
        start: Date;
        level: TraceLevel;

        /**
         * correlation Id is a guid which will be used to correlate UX operations and API operations
         */
        correlationId?: string;

        /**
         * Source is the component to which the event is associated. It can be Map or TimeControl or PropertiesPanel... etc.
         */
        source: string;
        steps?: TelemetryStep[];
        properties?: any;
    }

    interface TelemetryStep {
        name: string;
        message: string;
        time: Date;
    }
}

declare module DependencyMap.Integrations {

    const enum SearchTriggerType {
        OnMachineListLoaded = 0,//trigger on general searches, this includes when the machine list loads
        OnEntitySelected = 1 //trigger when an entity is selected
    }

    interface ISearchIntegrationQuery {
        queryId: string;
        triggerType: SearchTriggerType;
        entity?: IEntity;
    }

    interface IAdmMapAdapter {
        mapApi: IAdmMapApi;
        onMapUpdate: (mapAPI: IAdmMapApi, records: RecordMap) => void;
    }

    type IUpdatePanelContextFunction = (selection: SelectionContext) => void;

    interface IAdmSummaryAdapter {
        displayOrder: number;
        summaries: KnockoutObservableArray<IAdmSummary<any>>;
        onUpdate: () => void;
        onMapSelectionUpdate: (selection: DependencyMap.SelectionContext) => void;
        onMapUpdate: (mapAPI: IAdmMapApi) => void;
    }

    interface IAdmIntegrationPrerequisteRequierment {
        header: string,
        icon: string,
        action: Function;
    }

    type AdmSummaryValue = string | string[] | IAdmSummaryCounter[];

    //an adm summary can be a single string, an array of strings, or an array of counters
    interface IAdmSummary<T extends AdmSummaryValue> {
        type: IAdmSummaryType;
        name?: string;
        value: T;
        action?: Function;
        showIntegrationOnClick?: boolean;
        emphasis?: EmphasisType;
    }

    interface IAdmSummaryCounter {
        name: string;
        value: number | string;
        emphasis?: EmphasisType;
    }

    const enum IAdmSummaryType {
        sectionHeader = 0,
        value = 1,
        list = 2,
        counterSet = 3,
        link = 4
    }

    type GetSummariesFunction = (entity: DependencyMap.IEntity, mapModel: DependencyMap.IMap) => IAdmSummary<AdmSummaryValue>[];

    interface IAdmMapApi {
        mapModel: DependencyMap.IMap;
        setEntityProperty: (entityId: string, name: string, value: any) => void;
        addNodeBadge: (nodeId: string, badge: MapBadge) => void;
        loadAllClientGroupMembers: (clientGroup: DependencyMap.IClientGroup) => void;
    }

    export interface IAlert {
        // fields from log search
        id: string;
        TimeGenerated: string;
        AlertName: string;
        AlertRuleId: string;
        AlertRuleInstanceId: string; // guid for alert record
        AlertSeverity: string;      // "Critical", "Warning" or "Informational"
        Query: string;
        QueryExecutionStartTime: string;
        QueryExecutionEndTime: string;
        Computer?: string;           // computer name
        ThresholdOperator?: string;
        ThresholdValue?: number;
        LinkToSearchResults?: string;

        // custom fields
        severityLevel: DependencyMap.EmphasisType;

        /**
         * Local time formatted value of 'TimeGenerated' property of this object.
         */
        formattedQueryTimeGeneated: string;

        /**
         * Local time formatted value of 'QueryExecutionStartTime' property of this object.
         */
        formattedQueryExecutionStartTime: string;

        /**
         * Local time formatted value of 'QueryExecutionEndTime' property of this object.
         */
        formattedQueryExecutionEndTime: string;
    }

    export interface ILogEvents {
        Type: string;
        AggregatedValue: number;
    }

    interface MapBadge {
        integrationId: string,
        integrationName: BadgeType,
        emphasis: EmphasisType,
        icon: string; // url to icon
        count: number;
        emphasisOnly?: boolean;
    }

    // Takes a list of records for an entity and returns a badge to represent it
    interface CreateMapBadgeFunction {
        (records: any[]): MapBadge;
    }

    const enum PanelBlockerType {
        error = 0,
        busy = 1
    }

    interface IPanelBlocker {
        type: PanelBlockerType;
        message: string;
    }

    export interface IEntityTypeDisplayNameMap {
        [type: number]: { plural: string, singular: string }
    }

    // Maps entity ids to sets of records
    interface RecordMap {
        [id: string]: any | any[];
    }

    const enum MachineMapBy {
        agentId = 0,
        computerName = 1
    }
    // Maps entity ids to sets of records
    interface MachineMap {
        [id: string]: DependencyMap.IMachine;
    }

    interface MachineSummaryCount {
        processes: number;
        connections: number;
        inbound: number;
        outbound: number;
        failedConnections: number;
        servers: number;
        clients: number;
        isClientCountAproximate: boolean;
    }

    interface ProcessSummaryCount {
        ports: number;
        portNumbers: string[];
        connections: number;
        inbound: number;
        outbound: number;
        failedConnections: number;
        servers: number;
        clients: number;
        isClientCountAproximate: boolean;
    }
}

declare module DependencyMap.Api {
    interface ArmResource {
        id: string;          // path to resource
        name: string;        // identifier for resource in collection
        type?: string;        // collection type
        etag?: string;
        kind?: string;
        properties?: any;
    }

    interface Data {
        structure: any;
        badges?: Integrations.MapBadge[];
    }
}

declare module DependencyMap.Api.v2 {

    interface ProcessHostedService {
        name: string;
        displayName: string;
    }

    interface ArmResource extends DependencyMap.Api.ArmResource {
    }

    interface Machine extends ArmResource {
        properties: {
            displayName: string;
            computerName?: string;
            fullyQualifiedDomainName?: string;
            monitoringState: string;
            bootTime?: string;
            virtualizationState?: string;
            virtualMachine?: VirtualMachineConfiguration;
            hypervisor?: HypervisorConfiguration;
            networking?: NetworkConfiguration;
            agent?: AgentConfiguration;
            resources?: MachineResourcesConfiguration;
            operatingSystem?: OperatingSystemConfiguration;
            timezone?: TimeZoneInfo;
            hosting?: HostingConfiguration;
        }
    }

    interface HostingConfiguration {
        kind?: string;
        resourceId?: string;
        provider?: string;
        vmId?: string;
        location?: string;
        name?: string;
        size?: string;
        updateDomain?: string;
        faultDomain?: string;
        subscriptionId?: string;
        resourceGroup?: string;
        image?: ImageConfiguration;
        cloudService?: AzureCloudServiceConfiguration;
        vmScaleSet?: AzureVmScaleSetConfiguration;
        serviceFabricCluster?: AzureServiceFabricClusterConfiguration;
    }

    interface ImageConfiguration {
        offering?: string;
        publisher?: string;
        sku?: string;
        version?: string;
    }

    interface AzureCloudServiceConfiguration {
        name?: string;
        instanceId?: string;
        deployment?: string;
        roleName?: string;
        roleType?: string;
    }

    interface AzureVmScaleSetConfiguration {
        name?: string;
        instanceId?: string;
        deployment?: string;
        resourceId?: string;
    }

    interface AzureServiceFabricClusterConfiguration {
        name?: string;
        clusterId?: string;
    }

    interface MachineHint extends ArmResource {
        properties: {
            displayNameHint: string;
            osFamilyHint: string;
        }
    }

    interface Process extends ArmResource {
        properties: {
            displayName: string;
            executableName?: string;
            monitoringState: string;
            startTime?: string;
            group?: string;
            role?: string;
            details?: ProcessDetails;
            user?: ProcessUser;
            machine: ArmResource;
            acceptorOf?: ArmResource;
            clientOf?: ArmResource;
        }
    }

    interface ProcessGroup extends ArmResource {
        properties: {
            displayName: string;
            machine: ArmResource;
        }
    }

    interface Port extends ArmResource {
        properties: {
            displayName: string;
            monitoringState: string;
            ipAddress: string;
            portNumber: number;
            machine: ArmResource;
        }
    }

    interface ClientGroup extends ArmResource {
        properties: {
            clientsOf: ArmResource
        }
    }

    interface ClientGroupMember extends ArmResource {
        properties: {
            ipAddress: string;
            port: ArmResource;
            processes: ArmResource[];
        }
    }

    interface ClientGroupMemberCount {
        startTime: string;
        endTime: string;
        groupId: string;
        count: number;
        accuracy: string;
    }

    //data model interface
    interface AggConnection extends ArmResource {
        properties: {
            clients?: string[];
            servers?: string[];
            portIds?: string[];
        }
    }

    interface Connection extends ArmResource {
        properties: {
            source: ArmResource;
            destination: ArmResource;
            serverPort?: ArmResource;
            failureState?: string;
        }
    }

    interface Acceptor extends ArmResource {
        properties: {
            source: ArmResource;
            destination: ArmResource;
            serverPort?: ArmResource;
            failureState?: string;
        }
    }

    interface MachineGroup extends ArmResource {
        properties: {
            displayName: string;
            groupType: string;
            machines: ArmResource[];
        }
    }

    interface NetworkConfiguration {
        dnsNames?: string[];
        ipv4Interfaces?: IPv4Interface[];
        ipv6Interfaces?: IPv6Interface[];
        macAddresses?: string[];
        defaultIpv4Gateways?: string[];
    }

    interface IPv4Interface {
        ipAddress: string;
        subnetMask: string;
    }

    interface IPv6Interface {
        ipAddress: string;
    }

    interface TimeZoneInfo {
        fullName: string;
    }

    interface AgentConfiguration {
        agentId: string;
        dependencyAgentId: string;
        dependencyAgentVersion?: string;
        dependencyAgentRevision?: string;
        rebootStatus?: string;
        clockGranularity?: number;
    }

    interface OperatingSystemConfiguration {
        fullName: string;
        family: string;
        bitness: string;
    }

    interface MachineResourcesConfiguration {
        physicalMemory: number;
        cpus: number;
        cpuSpeed: number;
        cpuSpeedAccuracy: string;
    }

    interface VirtualMachineConfiguration {
        virtualMachineType: string;
        virtualMachineName?: string;
        nativeMachineId?: string;
        nativeHostMachineId?: string;
    }

    interface HypervisorConfiguration {
        hypervisorType: string;
        nativeHostMachineId?: string;
    }

    interface ProcessDetails {
        persistentKey: string;
        poolId?: number;
        firstPid?: number;
        description?: string;
        companyName?: string;
        internalName?: string;
        productName?: string;
        productVersion?: string;
        fileVersion?: string;
        commandLine?: string;
        executablePath?: string;
        workingDirectory?: string;
        services?: any;
    }

    interface ProcessUser {
        userName: string;
        userDomain?: string;
    }

    export interface Map {
        nodes: NodeMap;
        edges: EdgeMap;
    }

    export interface NodeMap {
        machines: Machine[];
        processes: Process[];
        ports: Port[];
        clientGroups: ClientGroup[];
    }

    export interface EdgeMap {
        connections: Connection[];
        acceptors: Acceptor[];
    }

    export interface MachineCollection {
        value: Machine[];
        nextLink?: string;
    }

    export interface MachineGroupCollection {
        value: MachineGroup[];
    }

    interface ClientGroupMembersCollection {
        value: ClientGroupMember[];
        nextLink?: string;
    }

    export interface CustomizedProperty {
        entityId: string;
        propertyName: string;
        propertyValue: string;
    }

    export interface Data extends DependencyMap.Api.Data {
        structure: MapResponse;
        clientCloudInfo?: ClientGroupMembersCollection[];
        customizedProperties?: CustomizedProperty[];
    }

    const enum MachineKind {
        SingleMachine = "map:single-machine-dependency",
        GroupMachine = "map:machine-group-dependency"
    }

    export type MapRequestKind = MachineKind.GroupMachine | MachineKind.SingleMachine;

    export interface MapRequest {
        startTime: string;
        endTime: string;
        kind: MapRequestKind;
    }

    export interface MachineMapRequest extends MapRequest {
        machineId: string;
    }

    export interface MachineGroupMapRequest extends MapRequest {
        machineGroupId: string;
    }

    export interface MapResponse {
        startTime: string;
        endTime: string;
        map: Map;
    }

    interface MachineSummary extends ArmResource {
        properties: {
            startTime: string;
            endTime: string;
            live: number;
            os: {
                linux: number;
                windows: number;
            };
            total: number;
        }
    }
}

declare module DependencyMap.Api.v3 {
    interface ArmResource extends DependencyMap.Api.v2.ArmResource {}

    export interface Data extends DependencyMap.Api.Data {
        structure: MapResponse;
        clientServerGroupMachineMap?: ClientOrServerGroupMachineMap[]; // TODO: Remove this when we integrate with API.
        machineDetail?: Map;//TODO: same to above, maybe we can keep them
    }

    export interface MapResponse {
        startTime: string;
        endTime: string;
        map: Map;
    }

    export interface Map {
        nodes: NodeMap;
        edges: EdgeMap;
        summaries: MapSummaries;
    }

    export interface MapSummaries {
        clientGroupSummaries: ClientGroupSummary[];
        processesSummaries: ProcessSummary[];
        serverGroupSummaries: ServerGroupSummary[];
        mapSummary?: MapSummary;
    }

    export interface NodeMap {
        machines: Machine[];
        clientGroups: ClientGroup[];
        serverGroups: ServerGroup[];
        ports?: any[];//no need to keep it in api
        processes?: Process[];
        processGroups?: ProcessGroup[];
    }

    interface Process extends DependencyMap.Api.v2.Process { }
    interface ProcessGroup extends ArmResource {
        properties: {
            displayName: string;
            hostingMachine: ArmResource;
            count?: any;
            members?: any; //currently not used
        }
    }

    interface Machine extends DependencyMap.Api.v2.Machine {
        failState?: string;
    }
    interface ClientGroup extends DependencyMap.Api.v2.ClientGroup { }

    interface ServerGroup extends ArmResource {
        properties: {
            serversOf: any, //ArmResource[],seems like not consistent. but however not used
            portNumber: number;
        }
    }

    export interface EdgeMap {
        connections: Connection[];
        acceptors?: any;//no need to keep it in api
    }
    interface Connection extends DependencyMap.Api.v2.Connection { }

    export interface CustomizedProperty extends DependencyMap.Api.v2.CustomizedProperty {
    }

    export interface ClientGroupSummary {
        summaryOf: ArmResource;
        discoveredMembersCount: MemberCount;
        monitoredMembersCount: MemberCount;
        monitoredMembers: ArmResource[];
        discoveredMembers: ArmResource[];
    }
    
    export interface ProcessSummary {
        summaryOf: ArmResource;
        processesCount: MemberCount;
        processesTypes: string[];
    }

    export interface ServerGroupSummary {
        summaryOf: ArmResource;
        discoveredMembersCount: MemberCount;
        monitoredMembersCount: MemberCount;
        monitoredMembers: ArmResource[];
        discoveredMembers: ArmResource[];
    }

    export interface MapSummary {
        requestedMachineCount: number;
        actualMachineCount: number;
    }

    export interface MemberCount {
        accuracy: string;
        count: number;
    }
    
    export interface ClientOrServerGroupMachineMap {
        id?: string; // Id is added only to refer test data.
        value: ClientOrServerGroupMember[];
    }

    export interface ClientOrServerGroupMember extends ArmResource {
        properties: {
            displayName: string,
            monitoringState: string,
            osFamily: string,
            machineId: ArmResource,
            machine: ArmResource,
            connectionInfos: GroupMemberConnectionInfo[]
        }
    }

    export interface GroupMemberConnectionInfo {
        source: GroupMemberConnectionEndpoint,
        destination: GroupMemberConnectionEndpoint,
        portNumber: number,
        failureState: string
    }

    export interface GroupMemberConnectionEndpoint {
        machine: string,
        process: string,
        processId: ArmResource,
        monitoringState: string
    }
}

declare module DependencyMap.Kusto {
    export interface IKustoQueryResponse {
        Tables: IKustoTable[];
        Render: IKustoResponeVisualization,
        Statistics: IKustoStatistics,
        Error: OneApiError
    }
    export interface IKustoTable {
        Columns: ISearchV2ResultTableColumn[];
        Rows: any[][];
    }
    export interface IKustoResponeVisualization {
        visualization: string,
        title: string,
        accumulate: boolean,
        isQuerySorted: boolean,
        kind: string,
        annotation: string,
        by: any
    }
    export interface IKustoStatistics {
        query: IQueryStatistics
    }
    export interface IQueryStatistics {
        executionTime: number,
        resourceUsage: any
    }
    export interface OneApiError {
        code: string,
        message: string,
        target: string,
        details: OneApiError[],
        innererror: any
    }
    export interface ISearchV2ResultTableColumn {
        ColumnName: string;
        ColumnType: string;
    }
}

interface HTMLElement {
    selectionStart: number;
    selectionEnd: number;
} 

interface HTMLTextAreaElement {
    selectionDirection: string;
}

interface HTMLInputElement {
    selectionDirection: string;
}

interface Window {
    chrome: any;
    ActiveXObject: any;

    MsPortalFx: any;

    // Chrome
    OverflowEvent: any;
}

interface MessageEventListener extends EventListener {
    (evt: MessageEvent): void;
}

interface MouseEvent {
    // IE & Chrome
    wheelDelta?: number;
}

// The following parseInt is required here because lib.d supports only string as input.
// Even though TypeScript will not change the input to be any, it would be a big
// change in programming habits and language to transform all variables to a string
// before calling this function.
/**
 * Converts any into an integer.
 *
 * @param s A value to convert into a number.
 * @param radix A value between 2 and 36 that specifies the base of the number in numString. 
 * If this argument is not supplied, strings with a prefix of '0x' are considered hexadecimal.
 * All other strings are considered decimal.
 * @return Input converted to a number.
 */
declare function parseInt(s: any, radix?: number): number;

// The following focus is available on HTMLElement, however, focus is available on Element
interface Element {
    focus(): void;
}

interface StringMap<T> {
    [key: string]: T;
}

interface NumberMap<T> {
    [key: number]: T;
    length?: number;
}

interface NameValue<N, T> {
    name: N;
    value: T;
}

interface Error {
    stack?: string;
}

interface Event {
    // Chrome & Opera
    horizontalOverflow: boolean;
    verticalOverflow: boolean;
}

interface JQueryStatic {
    cleanData: (elements: Element[]) => void;
}

interface Func<R> {
    (): R;
}

interface KnockoutReadOnlyObservableBase<T> extends KnockoutSubscribable<T> {
    peek(): T;
    (): T;
}

interface KnockoutObservableBase<T> extends KnockoutObservable<T> {
}

interface KnockoutDisposable {
    dispose(): void;
}

interface JQueryEventHandler {
    (eventObject: JQueryEventObject, args?: any): any;
}

interface Set<T> {
    add(value: T): this;
    clear(): void;
    delete(value: T): boolean;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    size: number;
}

interface SetConstructor {
    new (): Set<any>;
    new <T>(values?: T[]): Set<T>;
    prototype: Set<any>;
}

declare var Set: SetConstructor;


interface APromise<T> extends Q.Promise<T> { }

interface ADeferred<T> extends Q.Deferred<T> { }