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
import { cn } from '@/lib/utils';

const toolbarButtonClass = (active: boolean) =>
    cn(
        "rounded-md p-1.5 transition-colors duration-150",
        active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

const TipTapMenuBar = ({ editor }: { editor: Editor }) => {
    if (!editor) return null;

    return (
        <div
            className="flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted/40 p-1"
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
                className={toolbarButtonClass(editor.isActive("bold"))}
            >
                <Bold className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleItalic().run()
                }}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={toolbarButtonClass(editor.isActive("italic"))}
            >
                <Italic className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleStrike().run()
                }}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={toolbarButtonClass(editor.isActive("strike"))}
            >
                <Strikethrough className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleCode().run()
                }}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={toolbarButtonClass(editor.isActive("code"))}
            >
                <Code className="size-4" />
            </button>
            
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 1 }))}
            >
                <Heading1 className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 2 }))}
            >
                <Heading2 className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 3 }))}
            >
                <Heading3 className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 4 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 4 }))}
            >
                <Heading4 className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 5 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 5 }))}
            >
                <Heading5 className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleHeading({ level: 6 }).run()
                }}
                className={toolbarButtonClass(editor.isActive("heading", { level: 6 }))}
            >
                <Heading6 className="size-4" />
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleBulletList().run()
                }}
                className={toolbarButtonClass(editor.isActive("bulletList"))}
            >
                <List className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleOrderedList().run()
                }}
                className={toolbarButtonClass(editor.isActive("orderedList"))}
            >
                <ListOrdered className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().toggleBlockquote().run()
                }}
                className={toolbarButtonClass(editor.isActive("blockquote"))}
            >
                <Quote className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().undo().run()
                }}
                disabled={!editor.can().chain().focus().undo().run()}
                className={cn(toolbarButtonClass(false), "disabled:opacity-40")}
            >
                <Undo className="size-4" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    editor.chain().focus().redo().run()
                }}
                disabled={!editor.can().chain().focus().redo().run()}
                className={cn(toolbarButtonClass(false), "disabled:opacity-40")}
            >
                <Redo className="size-4" />
            </button>
        </div>
    );
};
export default TipTapMenuBar;
