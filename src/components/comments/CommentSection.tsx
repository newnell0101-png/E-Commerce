import React, { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, Flag, Edit, Trash2, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { db } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  rating?: number;
  status: 'published' | 'pending' | 'hidden' | 'deleted';
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  replies?: Comment[];
  user_vote?: 'upvote' | 'downvote' | null;
}

interface CommentSectionProps {
  productId: string;
  allowRating?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  productId,
  allowRating = true
}) => {
  const { user, language, isAuthenticated } = useStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const translations = {
    en: {
      comments: 'Comments',
      writeComment: 'Write a comment...',
      writeReview: 'Write a review...',
      rating: 'Rating',
      submit: 'Submit',
      reply: 'Reply',
      edit: 'Edit',
      delete: 'Delete',
      report: 'Report',
      cancel: 'Cancel',
      save: 'Save',
      loginToComment: 'Login to comment',
      noComments: 'No comments yet',
      beFirst: 'Be the first to comment!',
      replying: 'Replying to',
      editing: 'Editing comment',
      confirmDelete: 'Are you sure you want to delete this comment?',
      commentDeleted: 'Comment deleted successfully',
      commentUpdated: 'Comment updated successfully',
      commentAdded: 'Comment added successfully',
      loadingComments: 'Loading comments...',
      sortBy: 'Sort by',
      newest: 'Newest',
      oldest: 'Oldest',
      mostLiked: 'Most Liked',
      showReplies: 'Show replies',
      hideReplies: 'Hide replies',
    },
    fr: {
      comments: 'Commentaires',
      writeComment: 'Écrire un commentaire...',
      writeReview: 'Écrire un avis...',
      rating: 'Note',
      submit: 'Envoyer',
      reply: 'Répondre',
      edit: 'Modifier',
      delete: 'Supprimer',
      report: 'Signaler',
      cancel: 'Annuler',
      save: 'Sauvegarder',
      loginToComment: 'Connectez-vous pour commenter',
      noComments: 'Aucun commentaire',
      beFirst: 'Soyez le premier à commenter!',
      replying: 'Répondre à',
      editing: 'Modifier le commentaire',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce commentaire?',
      commentDeleted: 'Commentaire supprimé avec succès',
      commentUpdated: 'Commentaire mis à jour avec succès',
      commentAdded: 'Commentaire ajouté avec succès',
      loadingComments: 'Chargement des commentaires...',
      sortBy: 'Trier par',
      newest: 'Plus récent',
      oldest: 'Plus ancien',
      mostLiked: 'Plus aimé',
      showReplies: 'Afficher les réponses',
      hideReplies: 'Masquer les réponses',
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getProductComments(productId);
      
      if (error) throw error;
      
      if (data) {
        // Organize comments into threads
        const commentMap = new Map();
        const rootComments: Comment[] = [];
        
        data.forEach((comment: Comment) => {
          commentMap.set(comment.id, { ...comment, replies: [] });
        });
        
        data.forEach((comment: Comment) => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
              parent.replies.push(commentMap.get(comment.id));
            }
          } else {
            rootComments.push(commentMap.get(comment.id));
          }
        });
        
        setComments(rootComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      setSubmitting(true);
      
      const commentData = {
        product_id: productId,
        user_id: user.id,
        content: newComment.trim(),
        rating: allowRating ? newRating : null,
        status: 'published'
      };
      
      const { error } = await db.createComment(commentData);
      
      if (error) throw error;
      
      setNewComment('');
      setNewRating(0);
      await loadComments();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    
    try {
      setSubmitting(true);
      
      const replyData = {
        product_id: productId,
        user_id: user.id,
        parent_id: parentId,
        content: replyContent.trim(),
        status: 'published'
      };
      
      const { error } = await db.createComment(replyData);
      
      if (error) throw error;
      
      setReplyContent('');
      setReplyingTo(null);
      await loadComments();
      
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      setSubmitting(true);
      
      const { error } = await db.updateComment(commentId, {
        content: editContent.trim(),
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      setEditContent('');
      setEditingComment(null);
      await loadComments();
      
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      const { error } = await db.deleteComment(commentId);
      
      if (error) throw error;
      
      await loadComments();
      
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;
    
    try {
      const { error } = await db.voteComment(commentId, user.id, voteType);
      
      if (error) throw error;
      
      await loadComments();
      
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="bg-white rounded-lg border p-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {comment.user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {comment.user?.full_name || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {comment.rating && (
            <div className="flex items-center space-x-2">
              {renderStars(comment.rating)}
              <span className="text-sm text-gray-600">({comment.rating}/5)</span>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {editingComment === comment.id ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={t.writeComment}
            />
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                onClick={() => handleEditComment(comment.id)}
                disabled={submitting || !editContent.trim()}
              >
                {t.save}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 mb-3">{comment.content}</p>
        )}

        {/* Comment Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Vote Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVoteComment(comment.id, 'upvote')}
                disabled={!isAuthenticated()}
                className={`flex items-center space-x-1 ${
                  comment.user_vote === 'upvote' ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{comment.upvotes}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVoteComment(comment.id, 'downvote')}
                disabled={!isAuthenticated()}
                className={`flex items-center space-x-1 ${
                  comment.user_vote === 'downvote' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{comment.downvotes}</span>
              </Button>
            </div>

            {/* Reply Button */}
            {!isReply && isAuthenticated() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="flex items-center space-x-1 text-gray-600"
              >
                <Reply className="w-4 h-4" />
                <span>{t.reply}</span>
              </Button>
            )}
          </div>

          {/* User Actions */}
          {user && user.id === comment.user_id && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                className="text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-4 pt-4 border-t">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={`${t.replying} ${comment.user?.full_name}...`}
            />
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                {t.reply}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t.comments} ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {isAuthenticated() ? (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder={allowRating ? t.writeReview : t.writeComment}
          />
          
          {allowRating && (
            <div className="flex items-center space-x-3 mt-3">
              <span className="text-sm font-medium text-gray-700">{t.rating}:</span>
              {renderStars(newRating, true, setNewRating)}
            </div>
          )}
          
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{t.submit}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700">{t.loginToComment}</p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">{t.loadingComments}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">{t.noComments}</p>
          <p className="text-sm text-gray-500">{t.beFirst}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};