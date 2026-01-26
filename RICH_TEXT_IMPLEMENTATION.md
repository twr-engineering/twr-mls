# Rich Text Editor Implementation

## Overview
This document describes the implementation of the Lexical rich text editor for the description field in the listing form.

## Components Created

### 1. RichTextEditor (`/src/components/ui/rich-text-editor.tsx`)
A fully-featured rich text editor component that integrates with react-hook-form and outputs Payload CMS compatible lexical format.

**Features:**
- Bold, Italic, Underline, Strikethrough, Code formatting
- Headings (H1, H2, H3)
- Bullet and numbered lists
- Block quotes
- Undo/Redo functionality
- Full integration with react-hook-form
- Compatible with Payload CMS lexical format

**Props:**
- `value`: LexicalContent | null - The current editor content
- `onChange`: (value: LexicalContent | null) => void - Callback when content changes
- `placeholder`: string - Placeholder text
- `className`: string - Additional CSS classes
- `readOnly`: boolean - Whether the editor is read-only

### 2. RichTextRenderer (`/src/components/ui/rich-text-renderer.tsx`)
A read-only component to display lexical rich text content with proper formatting.

**Props:**
- `value`: LexicalContent | null - The content to render
- `className`: string - Additional CSS classes

### 3. ToolbarPlugin (`/src/components/ui/rich-text-toolbar.tsx`)
The formatting toolbar for the rich text editor with all formatting controls.

### 4. LexicalContent Type (`/src/types/lexical.ts`)
A shared TypeScript type definition for Payload CMS lexical content format.

## Integration

### Form Integration
The listing form has been updated to use the RichTextEditor:

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <RichTextEditor
          value={field.value}
          onChange={field.onChange}
          placeholder="Detailed description of the property..."
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Display Integration
The listing detail page uses RichTextRenderer to display the content:

```tsx
<RichTextRenderer value={listing.description} />
```

## Schema Changes

The listing form schema was updated to accept the lexical format:

```typescript
const listingSchema = z.object({
  // ... other fields
  description: z.any().optional(),
  // ... other fields
})
```

## Package Dependencies

The following packages were installed:
- `lexical` - Core lexical editor
- `@lexical/react` - React bindings
- `@lexical/utils` - Utility functions
- `@lexical/list` - List support
- `@lexical/rich-text` - Rich text features
- `@lexical/link` - Link support
- `@lexical/selection` - Selection utilities

## Data Format

The editor produces and consumes Payload CMS compatible lexical format:

```typescript
type LexicalContent = {
  root: {
    type: string
    children: Array<{
      type: unknown
      version: number
      [k: string]: unknown
    }>
    direction: ('ltr' | 'rtl') | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    version: number
  }
  [k: string]: unknown
}
```

## Testing

To test the implementation:

1. Navigate to `/listings/new` to create a new listing
2. Use the rich text editor for the description field
3. Test all formatting options (bold, italic, lists, etc.)
4. Save the listing
5. View the listing to see the formatted content rendered

## Notes

- The editor maintains full compatibility with Payload CMS's lexical format
- The implementation uses shadcn/ui components for consistent styling
- Type safety is maintained throughout with TypeScript
- The editor supports both creating new listings and editing existing ones
- All formatting is preserved when saving and loading
