'use client'

import { useState } from 'react'
import {
    Key, Users, Building2, FolderOpen, Search, Plus, Edit, Trash2, MoreHorizontal,
    Star, Calendar, Database, Server, Globe, FileText, Folder, Copy, Check, Clock,
    Mail, Lock, Eye, EyeOff, Download, Upload, Settings, Bell, User, LogOut
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

// Section wrapper component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
            {children}
        </section>
    )
}

// Subsection wrapper
function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {children}
        </div>
    )
}

export default function PlaygroundPage() {
    const [switchValue, setSwitchValue] = useState(false)
    const [inputValue, setInputValue] = useState('')

    return (
        <div className="container mx-auto py-8 space-y-12 max-w-6xl">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Component Playground</h1>
                <p className="text-muted-foreground">
                    Visualisez et testez tous les composants UI avec des donnees fictives.
                </p>
            </div>

            {/* BUTTONS */}
            <Section title="Buttons">
                <Subsection title="Variants">
                    <div className="flex flex-wrap gap-3">
                        <Button variant="default">Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                    </div>
                </Subsection>

                <Subsection title="Sizes">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button size="xs">Extra Small</Button>
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                    </div>
                </Subsection>

                <Subsection title="With Icons">
                    <div className="flex flex-wrap gap-3">
                        <Button><Plus className="h-4 w-4" /> Ajouter</Button>
                        <Button variant="outline"><Download className="h-4 w-4" /> Exporter</Button>
                        <Button variant="secondary"><Upload className="h-4 w-4" /> Importer</Button>
                        <Button variant="destructive"><Trash2 className="h-4 w-4" /> Supprimer</Button>
                    </div>
                </Subsection>

                <Subsection title="Icon Only">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button size="icon-xs" variant="ghost"><Settings className="h-3 w-3" /></Button>
                        <Button size="icon-sm" variant="ghost"><Bell className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline"><Search className="h-4 w-4" /></Button>
                        <Button size="icon-lg" variant="secondary"><User className="h-5 w-5" /></Button>
                    </div>
                </Subsection>

                <Subsection title="States">
                    <div className="flex flex-wrap gap-3">
                        <Button disabled>Disabled</Button>
                        <Button variant="outline" disabled>Disabled Outline</Button>
                    </div>
                </Subsection>
            </Section>

            {/* BADGES */}
            <Section title="Badges">
                <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                </div>
            </Section>

            {/* INPUTS */}
            <Section title="Form Controls">
                <Subsection title="Input">
                    <div className="grid gap-4 max-w-md">
                        <Input placeholder="Placeholder text..." />
                        <Input type="email" placeholder="email@example.com" />
                        <Input type="password" placeholder="Password" />
                        <Input disabled placeholder="Disabled input" />
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher..." className="pl-9" />
                        </div>
                    </div>
                </Subsection>

                <Subsection title="Textarea">
                    <div className="max-w-md">
                        <Textarea placeholder="Entrez une description..." />
                    </div>
                </Subsection>

                <Subsection title="Select">
                    <div className="max-w-md">
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Selectionnez un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="db">Base de donnees</SelectItem>
                                <SelectItem value="ssh">Serveur SSH</SelectItem>
                                <SelectItem value="ftp">FTP / SFTP</SelectItem>
                                <SelectItem value="cms">CMS</SelectItem>
                                <SelectItem value="api">API Key</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Subsection>

                <Subsection title="Switch">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch id="switch-default" checked={switchValue} onCheckedChange={setSwitchValue} />
                            <Label htmlFor="switch-default">Default</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="switch-sm" size="sm" />
                            <Label htmlFor="switch-sm">Small</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="switch-disabled" disabled />
                            <Label htmlFor="switch-disabled">Disabled</Label>
                        </div>
                    </div>
                </Subsection>
            </Section>

            {/* CARDS */}
            <Section title="Cards">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Titre de la carte</CardTitle>
                            <CardDescription>Description de la carte avec plus de details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Contenu de la carte. Vous pouvez mettre du texte, des composants, etc.
                            </p>
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button variant="outline" size="sm">Annuler</Button>
                            <Button size="sm">Sauvegarder</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Carte avec action</CardTitle>
                            <CardDescription>Cette carte a un bouton d'action.</CardDescription>
                            <CardAction>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Production DB</p>
                                    <p className="text-sm text-muted-foreground">PostgreSQL - AWS RDS</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Client Card Example */}
                <Subsection title="Client Card Style">
                    <Card className="group relative flex flex-row items-center justify-between p-4 transition-all hover:shadow-md max-w-2xl">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                                A
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <h3 className="font-semibold leading-none tracking-tight truncate">Acme Corporation</h3>
                                <p className="text-sm text-muted-foreground truncate">www.acme.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="mr-2 h-3 w-3" />
                                24/03/2024
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-400">
                                    <Star className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Subsection>

                {/* Secret Card Example */}
                <Subsection title="Secret Card Style">
                    <Card className="max-w-xl overflow-hidden transition-all hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold leading-none mb-1.5 flex items-center gap-2">
                                            Production Database
                                            <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5 text-muted-foreground">
                                                Acme Corp
                                            </Badge>
                                        </CardTitle>
                                        <Badge variant="secondary" className="font-normal text-xs">
                                            Base de donnees
                                        </Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-secondary/30 rounded-lg p-2 space-y-1">
                                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                                    <span className="text-[10px] uppercase font-bold w-8 text-muted-foreground">User</span>
                                    <span className="truncate flex-1 font-mono text-sm">admin_user</span>
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                                    <span className="text-[10px] uppercase font-bold w-8 text-muted-foreground">Host</span>
                                    <span className="truncate flex-1 font-mono text-sm">db.example.com</span>
                                    <span className="text-xs text-muted-foreground px-1">:5432</span>
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                                    <span className="text-[10px] uppercase font-bold w-8 text-muted-foreground">DB</span>
                                    <span className="truncate flex-1 font-mono text-sm">production_db</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm tracking-widest">••••••••••••</span>
                                    <Button variant="ghost" size="icon-xs" className="ml-auto">
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-xs">
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Subsection>
            </Section>

            {/* AVATARS */}
            <Section title="Avatars">
                <Subsection title="Sizes">
                    <div className="flex items-center gap-4">
                        <Avatar size="sm">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar size="lg">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </div>
                </Subsection>

                <Subsection title="Fallbacks">
                    <div className="flex items-center gap-4">
                        <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
                        <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
                        <Avatar><AvatarFallback>XY</AvatarFallback></Avatar>
                    </div>
                </Subsection>

                <Subsection title="Avatar Group">
                    <AvatarGroup>
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
                        <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
                        <AvatarGroupCount>+5</AvatarGroupCount>
                    </AvatarGroup>
                </Subsection>
            </Section>

            {/* TABS */}
            <Section title="Tabs">
                <Subsection title="Default">
                    <Tabs defaultValue="general" className="max-w-xl">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="security">Securite</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general" className="p-4 border rounded-lg mt-2">
                            Contenu de l'onglet General
                        </TabsContent>
                        <TabsContent value="security" className="p-4 border rounded-lg mt-2">
                            Contenu de l'onglet Securite
                        </TabsContent>
                        <TabsContent value="notifications" className="p-4 border rounded-lg mt-2">
                            Contenu de l'onglet Notifications
                        </TabsContent>
                    </Tabs>
                </Subsection>

                <Subsection title="Line Variant">
                    <Tabs defaultValue="info" className="max-w-xl">
                        <TabsList variant="line">
                            <TabsTrigger value="info">Informations</TabsTrigger>
                            <TabsTrigger value="secrets">Secrets</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="info" className="p-4 mt-2">
                            Contenu Informations
                        </TabsContent>
                        <TabsContent value="secrets" className="p-4 mt-2">
                            Contenu Secrets
                        </TabsContent>
                        <TabsContent value="documents" className="p-4 mt-2">
                            Contenu Documents
                        </TabsContent>
                    </Tabs>
                </Subsection>
            </Section>

            {/* TABLE */}
            <Section title="Table">
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Jean Dupont</TableCell>
                                <TableCell>jean@example.com</TableCell>
                                <TableCell><Badge variant="secondary">Admin</Badge></TableCell>
                                <TableCell><Badge variant="default">Actif</Badge></TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Marie Martin</TableCell>
                                <TableCell>marie@example.com</TableCell>
                                <TableCell><Badge variant="secondary">Membre</Badge></TableCell>
                                <TableCell><Badge variant="default">Actif</Badge></TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Pierre Bernard</TableCell>
                                <TableCell>pierre@example.com</TableCell>
                                <TableCell><Badge variant="secondary">Restreint</Badge></TableCell>
                                <TableCell><Badge variant="outline">En attente</Badge></TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </Section>

            {/* DIALOGS */}
            <Section title="Dialogs & Overlays">
                <div className="flex flex-wrap gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">Ouvrir Dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Titre du Dialog</DialogTitle>
                                <DialogDescription>
                                    Ceci est un dialog avec un titre et une description.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input placeholder="Entrez quelque chose..." />
                            </div>
                            <DialogFooter>
                                <Button variant="outline">Annuler</Button>
                                <Button>Confirmer</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Ouvrir Alert Dialog</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irreversible. Elle supprimera definitivement les donnees.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="secondary">Ouvrir Sheet</Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Panneau lateral</SheetTitle>
                                <SheetDescription>
                                    Un panneau qui glisse depuis le cote de l'ecran.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom</Label>
                                    <Input placeholder="Votre nom" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="email@example.com" />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </Section>

            {/* DROPDOWN MENU */}
            <Section title="Dropdown Menu">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <User className="h-4 w-4" />
                            Mon Compte
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Parametres
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Deconnexion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Section>

            {/* SKELETON */}
            <Section title="Skeleton (Loading States)">
                <div className="space-y-4 max-w-md">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            </Section>

            {/* ICONS */}
            <Section title="Common Icons">
                <div className="flex flex-wrap gap-4">
                    {[
                        { icon: Key, label: 'Key' },
                        { icon: Users, label: 'Users' },
                        { icon: Building2, label: 'Building2' },
                        { icon: FolderOpen, label: 'FolderOpen' },
                        { icon: Database, label: 'Database' },
                        { icon: Server, label: 'Server' },
                        { icon: Globe, label: 'Globe' },
                        { icon: FileText, label: 'FileText' },
                        { icon: Star, label: 'Star' },
                        { icon: Calendar, label: 'Calendar' },
                        { icon: Search, label: 'Search' },
                        { icon: Plus, label: 'Plus' },
                        { icon: Edit, label: 'Edit' },
                        { icon: Trash2, label: 'Trash2' },
                        { icon: Settings, label: 'Settings' },
                        { icon: Bell, label: 'Bell' },
                        { icon: Mail, label: 'Mail' },
                        { icon: Lock, label: 'Lock' },
                        { icon: Download, label: 'Download' },
                        { icon: Upload, label: 'Upload' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Icon className="h-5 w-5" />
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* COLORS */}
            <Section title="Color Palette">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-primary flex items-end p-2">
                            <span className="text-xs text-primary-foreground">primary</span>
                        </div>
                        <div className="h-16 rounded-lg bg-secondary flex items-end p-2">
                            <span className="text-xs text-secondary-foreground">secondary</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-destructive flex items-end p-2">
                            <span className="text-xs text-white">destructive</span>
                        </div>
                        <div className="h-16 rounded-lg bg-muted flex items-end p-2">
                            <span className="text-xs text-muted-foreground">muted</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-accent flex items-end p-2">
                            <span className="text-xs text-accent-foreground">accent</span>
                        </div>
                        <div className="h-16 rounded-lg bg-card border flex items-end p-2">
                            <span className="text-xs text-card-foreground">card</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-background border flex items-end p-2">
                            <span className="text-xs text-foreground">background</span>
                        </div>
                        <div className="h-16 rounded-lg bg-input border flex items-end p-2">
                            <span className="text-xs">input</span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* SEPARATOR */}
            <Section title="Separator">
                <div className="space-y-4 max-w-md">
                    <p className="text-sm text-muted-foreground">Texte au dessus</p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">Texte en dessous</p>
                </div>
            </Section>

        </div>
    )
}
