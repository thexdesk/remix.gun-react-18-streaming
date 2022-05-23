type StateMachineInit<T> = T;
export function StateMachine<T, ActionType>(
    handlers: Map<ActionType, (state: StateMachineInit<T>) => StateMachineInit<T>>
) {
    return function dispatcher(
        state: StateMachineInit<T>,
        {
            type,
        }: {
            type: ActionType;
        }
    ) {
        let handle = handlers.get(type);

        handle ? (state = handle(state)) : null;
        const dispatch = ({
            type,
            payload,
        }: {
            type: ActionType;
            payload?: StateMachineInit<T>;
        }) => dispatcher({ ...state, payload }, { type });
        return { state, dispatch };
    };
}

const ACTION = { TOGGLE: "TOGGLE", RECORD: "RECORD" };
type ActionType = typeof ACTION.TOGGLE | typeof ACTION.RECORD;
type StateType = Partial<{ toggle: boolean; record: Record<string, string> }>;
export let handler = new Map<ActionType, (state: StateType) => StateType>([
    [ACTION.TOGGLE, (state) => ({ ...state, toggle: !state.toggle })],
    [
        ACTION.RECORD,
        (state) => {
            return state;
        },
    ],
]);