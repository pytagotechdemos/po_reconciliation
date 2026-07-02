"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Edit2, Trash2, Shield, UserCog, User } from "lucide-react";
import { useRouter } from "next/navigation";

export type UserType = {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function UsersTable({ initialUsers }: { initialUsers: UserType[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    role: "warehouse",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      name: "",
      password: "",
      role: "warehouse",
      isActive: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (user: UserType) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      
      const payload: Record<string, unknown> = {
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (!editingUser) {
        payload.username = formData.username;
        payload.password = formData.password;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Terjadi kesalahan");
      }

      const updatedUser = await res.json();

      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      } else {
        setUsers([updatedUser, ...users]);
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus user");
      }

      setUsers(users.filter(u => u.id !== deletingUser.id));
      setIsDeleteModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "owner": return <Badge variant="default"><Shield className="w-3 h-3 mr-1"/> Owner</Badge>;
      case "procurement": return <Badge variant="warning"><UserCog className="w-3 h-3 mr-1"/> Procurement</Badge>;
      case "finance": return <Badge variant="success"><UserCog className="w-3 h-3 mr-1"/> Finance</Badge>;
      case "warehouse": return <Badge variant="secondary"><User className="w-3 h-3 mr-1"/> Warehouse</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Daftar Pengguna</h2>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                Belum ada data pengguna
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                <TableCell>@{user.username}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="destructive">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(user)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!editingUser && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <Input
                required
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Password {editingUser && "(Kosongkan jika tidak ingin diubah)"}
            </label>
            <Input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              required
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="warehouse">Warehouse</option>
              <option value="procurement">Procurement</option>
              <option value="finance">Finance</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          {editingUser && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Akun Aktif (Dapat Login)
              </label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Pengguna"
        variant="destructive"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus pengguna <span className="font-semibold text-slate-900">@{deletingUser?.username}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
