# HashCalls

This project is a full-stack application for managing NFT options, including buying, writing and exercising calls and puts using the Hedera Token Service. The backend service interacts with AWS DynamoDB, S3, and various Hedera Hashgraph transactions, while the frontend is built with Next.js and Tailwind CSS.

## Getting Started

### Frontend

First, install packages and run the development server:

```bash
cd frontend
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend Services

### addBuyerToOptionDynamo

Handles adding a buyer to an option in DynamoDB.

### buyOption

Handles the process of buying an option, including minting NFTs and uploading metadata to S3.

### excersiseOption

Handles exercising an option, including burning buyer NFTs and wiping writer NFTs.

### getAllBuyableOptions

Fetches all buyable options from the database.

### getNftsOwned

Fetches NFTs owned by a user.

### getOptions

Fetches options from the database.

### hasNft

Checks if a user owns a specific NFT.

### uploadOptionToDynamo

Uploads option data to DynamoDB.

### wipeExercised

Wipes exercised options from the database and burns NFTs.

### wipeExpired

Wipes expired options from the database and burns NFTs.

### writeOption

Handles writing an option, including minting writer NFTs and uploading metadata to S3.

## Frontend

The frontend is built with Next.js and Tailwind CSS. It includes configuration files for ESLint, PostCSS, and Tailwind.
