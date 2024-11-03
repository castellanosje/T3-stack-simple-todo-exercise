import { TRPCError } from '@trpc/server';
import { z } from "zod";
import { todoInput } from '../../../types';
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const todoRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    const todos = await ctx.prisma.todo.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    const todosFromPrisma = todos.map(({ id, text, done }) => ({
      id,
      text,
      done,
    }));

    return todosFromPrisma;
   
  }),
  create: protectedProcedure
    .input(todoInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.todo.create({
        data: {
          text: input,
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),
  delete: protectedProcedure
    .input(todoInput)
    .mutation(async ({ ctx, input }) => {
      // throw new TRPCError({code:"INTERNAL_SERVER_ERROR"});
      return ctx.prisma.todo.delete({
        where: {
          id: input,
        },
      });
    }),
  toggle: protectedProcedure
    .input(z.object({
      id:z.string(),
      done:z.boolean()
    }))
    .mutation(async ({ ctx, input:{id,done} }) => {
      return ctx.prisma.todo.update({
        where: {
          id
        },
        data:{
          done
        }
      });
    }),
});

