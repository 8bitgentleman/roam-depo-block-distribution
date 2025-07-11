Block Sender is a Roam Research extension that automates the creation of block references based on user-defined tag rules.

## 🎬 Example

<video src="https://github-production-user-asset-6210df.s3.amazonaws.com/4028391/373327914-fe400195-8473-4b08-a58e-59352670e0a2.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20241003%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241003T160318Z&X-Amz-Expires=300&X-Amz-Signature=fbfedc3347bce1d9e1f058fab938622dfb1b0cff110f6f8c9c9d8f6299492780&X-Amz-SignedHeaders=host" max-width="600"></video>

## ✨ How It Works

1. When a block is tagged with a watched tag, Block Sender detects the change
2. Based on your chosen reference type:
   - **Reference types**: A block reference is created at the destination, original block stays in place
   - **Move Block**: The original block is moved to the destination (optionally leaving a reference behind)
3. The original tag is removed from the block

## 🚀 Usage

1. Install the extension in your Roam Research graph
2. Navigate to the extension settings
3. Create rules by specifying:
   - A tag to watch
   - A destination type (block, page, or block UID)
   - A reference type (block reference, embed, embed-path, embed-children, or move block)
   - The specific destination
   - For move block: option to leave reference at original location
4. Block Sender will now monitor your graph and create block references according to your rules

## 💡 Benefits

- Enhance information connectivity in your Roam graph
- Automate cross-referencing and reduce manual block referencing
- Choose between block references, embeds, or moving blocks for flexible content organization
- Maintain clean, tag-free blocks while creating new connections
- Preserve original context while distributing information
- Reorganize content structure with the move block feature

## 🔧 Reference Types

**Block Reference** (default): `((block_ref))` - Creates a simple block reference
**Embed**: `{{[[embed]]: ((UID))}}` - Embeds the full block content
**Embed Path**: `{{[[embed-path]]: ((UID))}}` - Embeds with breadcrumb path
**Embed Children**: `{{[[embed-children]]: ((UID))}}` - Embeds block and its children
**Move Block**: Moves the original block to the destination (with optional reference at origin)
