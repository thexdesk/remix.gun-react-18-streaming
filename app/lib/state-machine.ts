/*

const ACTION = { TOGGLE: "TOGGLE", RECORD: "RECORD" };

type ActionType = typeof ACTION.TOGGLE | typeof ACTION.RECORD;

type StateType = Partial<{ toggle: boolean; record: Record<string, string> }>

export let handler = new Map<ActionType, (state: StateType) => StateType>([
    [ACTION.TOGGLE, (state) => ({ ...state, toggle: !state.toggle })],
    [
        ACTION.RECORD,
        (state) => {
            return state;
        },
    ],
]);


let init = StateMachine(handler);
let first = init({ toggle: true }, { type: ACTION.TOGGLE });
console.log(first.state, "STATE_MACHINE_TOGGLE_FALSE");
let second = first.dispatch({ type: ACTION.TOGGLE });
console.log(second.state, "STATE_MACHINE_TOGGLE_TRUE");
let record = second.dispatch({
  type: ACTION.RECORD,
  payload: { record: { test: "testikleeez" } },
});
console.log(record.state, "STATE_MACHINE_RECORD");
console.log(first.state, "STATE_MACHINE_CHECK");*/


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
            payload: StateMachineInit<T>;
        }) => dispatcher({ ...state, payload }, { type });
        return { state, dispatch };
    };
}
