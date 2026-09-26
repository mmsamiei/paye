import App from '@/components/App';
export default async function PostPage({ params }: { params: Promise<{id:string}> }) { const { id }=await params; return <App initialPostId={id} />; }
