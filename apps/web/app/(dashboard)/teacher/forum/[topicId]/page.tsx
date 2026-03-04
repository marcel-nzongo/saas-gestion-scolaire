'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Pin } from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ForumTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTopic();
    loadReplies();
  }, [topicId]);

  const loadTopic = async () => {
    try {
      const res = await academicApi.get(`/resources/forum/topics?topic_id=${topicId}`);
      const topics = res.data.data || [];
      setTopic(topics[0] || null);
    } catch {
      console.error('Erreur chargement topic');
    }
  };

  const loadReplies = async () => {
    try {
      const res = await academicApi.get(
        `/resources/forum/topics/${topicId}/replies`
      );
      setReplies(res.data.data || []);
    } catch {
      console.error('Erreur chargement réponses');
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
    return 'bg-gray-100 text-gray-600';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'teacher') return 'Enseignant';
    if (role === 'admin') return 'Admin';
    return 'Élève';
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {topic?.title || 'Chargement...'}
        </h1>
        {topic?.is_pinned && (
          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            <Pin className="w-3 h-3" />
            Épinglé
          </span>
        )}
      </div>

      {/* Topic original */}
      {topic && (
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {topic.author_first_name?.[0]}{topic.author_last_name?.[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {topic.author_first_name} {topic.author_last_name}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    getRoleColor(topic.author_role),
                  )}>
                    {getRoleLabel(topic.author_role)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(topic.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
          </div>
        </Card>
      )}

      {/* Réponses */}
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

      {/* Zone de réponse */}
      <Card>
        <div className="p-4">
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Écrire une réponse..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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