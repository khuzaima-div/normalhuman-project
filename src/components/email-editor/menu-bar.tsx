'use client'
import React from 'react'
import type { Editor } from "@tiptap/react";
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo,
    Strikethrough,
    Undo,
} from "lucide-react";

const TipTapMenuBar = ({ editor }: { editor: Editor }) => {
    if (!editor) return null;

    return (
        <div
            className="flex flex-wrap gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleBold().run()
                }}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition ${editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Bold className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleItalic().run()
                }}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition ${editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Italic className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleStrike().run()
                }}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition ${editor.isActive("strike") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Strikethrough className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleCode().run()
                }}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={`p-1.5 rounded transition ${editor.isActive("code") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Code className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 1 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading1 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading2 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 3 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading3 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 4 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 4 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading4 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 5 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 5 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading5 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 6 }).run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 6 }) ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Heading6 className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleBulletList().run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <List className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleOrderedList().run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <ListOrdered className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleBlockquote().run()
                }}
                className={`p-1.5 rounded transition ${editor.isActive("blockquote") ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
            >
                <Quote className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().undo().run()
                }}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-1.5 rounded transition hover:bg-zinc-100 dark:hover:bg-zinc-800/50 disabled:opacity-40"
            >
                <Undo className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().redo().run()
                }}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-1.5 rounded transition hover:bg-zinc-100 dark:hover:bg-zinc-800/50 disabled:opacity-40"
            >
                <Redo className="size-4 text-zinc-700 dark:text-zinc-300" />
            </button>
        </div>
    );
};

export default TipTapMenuBar;