'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function StudentForumTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => { loadReplies(); }, [topicId]);

  const loadReplies = async () => {
    try {
      const res = await academicApi.get(
        `/resources/forum/topics/${topicId}/replies`
      );
      setReplies(res.data.data || []);
    } catch {
      console.error('Erreur');
    }
  };

  const handleReply = async () => {
    if (!newReply.trim()) return;
    setIsSending(true);
    try {
      await academicApi.post(
        `/resources/forum/topics/${topicId}/replies`,
        { content: newReply }
      );
      setNewReply('');
      await loadReplies();
    } catch {
      alert('Erreur lors de la réponse');
    } finally {
      setIsSending(false);
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'teacher') return 'bg-blue-100 text-blue-700';
    if (role === 'admin') return 'bg-purple-100 text-purple-700';
    if (role === 'parent') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'teacher') return 'Enseignant';
    if (role === 'admin') return 'Admin';
    if (role === 'parent') return 'Parent';
    return 'Élève';
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Discussion</h1>
      </div>

      <div className="space-y-4 mb-6">
        {replies.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">
            Aucune réponse pour le moment
          </p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">
                {reply.author_first_name?.[0]}{reply.author_last_name?.[0]}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {reply.author_first_name} {reply.author_last_name}
                  </p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    getRoleColor(reply.author_role),
                  )}>
                    {getRoleLabel(reply.author_role)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(reply.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Card>
        <div className="p-4">
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Écrire une réponse..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button onClick={handleReply} isLoading={isSending}>
              <Send className="w-4 h-4 mr-2" />
              Répondre
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}