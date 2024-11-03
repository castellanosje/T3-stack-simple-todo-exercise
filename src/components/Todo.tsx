import { toast } from 'react-hot-toast';
import type {Todo} from "../types";
import { api } from '../utils/api';

type TodoProps = {
  todo:Todo
} 
export default function Todo({ todo }: TodoProps) {
  const {done, id, text} = todo;
  const trpc = api.useContext();
  
  const { mutate: doneMutation } = api.todo.toggle.useMutation({
    onSettled: async () => {
      await trpc.todo.all.invalidate();
    },
    onMutate: async (input) => {
      // cancel any outgoing refetches so they don't overwirte our optimistic update
      await trpc.todo.all.cancel();
      // snapshot the previouse value
      const previousTodos = trpc.todo.all.getData();

      // Optimistically update to the new value
      trpc.todo.all.setData(undefined, (prev) => {
        if (!prev) return previousTodos;
        const optimisticTodos = prev.map((todo) => {
          if (todo.id === input.id) {
            return ({...todo, done:input.done})
          }
          return todo;
        });
        return optimisticTodos;
      });

      return { previousTodos };
    },
    onSuccess:(err, {done})=>{
      if(done){
        toast.success('Todo completed!! 🎉');
      }
    },
    onError: (err, id, ctx) => {
      // if api fails then get the old todo list from context
      toast.error("Oops! there was an error updating your todo 😰");
      trpc.todo.all.setData(undefined, () => ctx?.previousTodos);
    },
  });

  const { mutate: deleteMutation } = api.todo.delete.useMutation({
    onSettled: async () => {
      await trpc.todo.all.invalidate();
    },
    onMutate: async (deleteId) => {
      // cancel any outgoing refetches so they don't overwirte our optimistic update
      await trpc.todo.all.cancel();
      // snapshot the previouse value
      const previousTodos = trpc.todo.all.getData();
      
      // Optimistically update to the new value
      trpc.todo.all.setData(undefined, (prev) => {
        
        if(!prev) return  previousTodos;
        const optimisticTodos = prev?.filter(
          (todo) => todo.id !== deleteId
        );
        return optimisticTodos;
        
      });

      return { previousTodos };
    },
    onError: (err, id, ctx) => {
      // if api fails then get the old todo list from context
      toast.error("Oops! there was an error deleting the todo 😰");
      trpc.todo.all.setData(undefined, ()=> ctx?.previousTodos );
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            className="focus:ring-3 h-4 w-4 cursor-pointer rounded border border-gray-300 bg-gray-50 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
            type="checkbox"
            name="done"
            id={id}
            checked={done}
            onChange={(e)=>{
              doneMutation({id, done:e.target.checked});
            }}
          />
          <label
            htmlFor={id}
            className={`cursor-pointer ${done ? "line-through" : ""}`}
          >
            {text}
          </label>
        </div>
        <button
          className="w-full rounded-lg bg-blue-700 px-2 py-1 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:w-auto"
          onClick={()=>{
            deleteMutation(id);
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}