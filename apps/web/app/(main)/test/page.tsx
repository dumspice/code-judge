'use client';

/**
 * Trang showcase: hiển thị tất cả component UI dùng chung trong `components/ui`.
 * Đường dẫn: /test
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2Icon } from 'lucide-react';

const demoTableRows = [
  { id: '1', name: 'Hàm tổng', difficulty: 'Dễ', mode: 'ALGO' },
  { id: '2', name: 'API đăng nhập', difficulty: 'Trung bình', mode: 'PROJECT' },
  { id: '3', name: 'Đồ thị', difficulty: 'Khó', mode: 'ALGO' },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('space-y-4')}>
      <div>
        <h2 className={cn('text-lg font-semibold tracking-tight')}>{title}</h2>
        {description ? (
          <p className={cn('text-sm text-muted-foreground')}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function TestComponentsPage() {
  const [selectDemo, setSelectDemo] = useState('algo');

  return (
    <div className={cn('min-h-screen bg-background p-6 md:p-10')}>
      <div className={cn('mx-auto max-w-4xl space-y-12')}>
        <header className={cn('space-y-2 border-b border-border pb-8')}>
          <p className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground')}>
            Showcase
          </p>
          <h1 className={cn('text-3xl font-semibold tracking-tight')}>Component UI (/test)</h1>
          <p className={cn('max-w-2xl text-sm text-muted-foreground')}>
            Các khối dưới đây tương ứng với file trong{' '}
            <code className={cn('rounded bg-muted px-1 py-0.5 text-xs')}>components/ui/</code>.
            Dùng để kiểm tra theme, dark mode (thêm class <code className="rounded bg-muted px-1 text-xs">dark</code>{' '}
            lên <code className="rounded bg-muted px-1 text-xs">html</code> nếu cần) và nhất quán giao diện.
          </p>
        </header>

        <Section
          title="Button"
          description="Nút bấm — variants và kích thước từ buttonVariants / Button."
        >
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Các kiểu: default, outline, secondary, ghost, destructive, link.</CardDescription>
            </CardHeader>
            <CardContent className={cn('flex flex-wrap gap-2')}>
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <a href="#badge" className={cn(buttonVariants({ variant: 'link' }))}>
                Link (anchor + buttonVariants)
              </a>
            </CardContent>
            <CardFooter className={cn('flex flex-wrap gap-2 border-t bg-muted/30')}>
              <Button size="xs">XS</Button>
              <Button size="sm">SM</Button>
              <Button size="default">Default</Button>
              <Button size="lg">LG</Button>
              <Button size="icon" aria-label="Loading demo">
                <Loader2Icon className={cn('animate-spin')} />
              </Button>
            </CardFooter>
          </Card>
          <p className={cn('text-xs text-muted-foreground')}>
            Export thêm: <code className={cn('rounded bg-muted px-1')}>buttonVariants</code> để gắn class vào
            phần tử tùy chỉnh (xem type trong IDE).
          </p>
        </Section>

        <Section id="badge" title="Badge" description="Nhãn trạng thái / thẻ nhỏ.">
          <div className={cn('flex flex-wrap gap-2')}>
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="link">Link</Badge>
          </div>
        </Section>

        <Section
          title="Card"
          description="CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter."
        >
          <Card>
            <CardHeader className={cn('relative')}>
              <CardTitle>Thẻ ví dụ</CardTitle>
              <CardDescription>Mô tả phụ cho nội dung trong card.</CardDescription>
              <CardAction>
                <Badge variant="outline">Action</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className={cn('text-sm text-muted-foreground')}>
                Nội dung chính. Có thể đặt form, bảng hoặc editor ở đây.
              </p>
            </CardContent>
            <CardFooter className={cn('flex gap-2')}>
              <Button size="sm">Hành động</Button>
              <Button size="sm" variant="outline">
                Huỷ
              </Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Card size=&quot;sm&quot;</CardTitle>
              <CardDescription>Khoảng cách nhỏ hơn cho danh sách dày.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={cn('text-sm')}>Nội dung gọn.</p>
            </CardContent>
          </Card>
        </Section>

        <Section title="Label + Input" description="Trường nhập một dòng.">
          <Card>
            <CardContent className={cn('space-y-4 pt-6')}>
              <div className={cn('space-y-2')}>
                <Label htmlFor="test-input-email">Email</Label>
                <Input id="test-input-email" type="email" placeholder="you@example.com" />
              </div>
              <div className={cn('space-y-2')}>
                <Label htmlFor="test-input-disabled">Disabled</Label>
                <Input id="test-input-disabled" disabled placeholder="Không chỉnh sửa" />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="Label + Textarea" description="Nhiều dòng — phù hợp mã nguồn.">
          <Card>
            <CardContent className={cn('space-y-2 pt-6')}>
              <Label htmlFor="test-textarea">Mã nguồn</Label>
              <Textarea
                id="test-textarea"
                className={cn('min-h-[120px] font-mono text-sm')}
                placeholder="// code here"
                defaultValue={'function hello() {\n  return "world";\n}'}
              />
            </CardContent>
          </Card>
        </Section>

        <Section title="Label + Select" description="Dropdown chọn giá trị (controlled demo).">
          <Card>
            <CardContent className={cn('space-y-2 pt-6')}>
              <Label htmlFor="test-select">Chế độ bài</Label>
              <Select
                value={selectDemo}
                onValueChange={(v) => setSelectDemo(v ?? 'algo')}
              >
                <SelectTrigger id="test-select" className={cn('w-full max-w-md')}>
                  <SelectValue placeholder="Chọn..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="algo">Thuật toán (algo)</SelectItem>
                  <SelectItem value="project">Dự án fullstack (project)</SelectItem>
                </SelectContent>
              </Select>
              <p className={cn('text-xs text-muted-foreground')}>
                Giá trị hiện tại: <code className={cn('rounded bg-muted px-1')}>{selectDemo}</code>
              </p>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="Table"
          description="Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption."
        >
          <Card>
            <CardContent className={cn('pt-6')}>
              <Table>
                <TableCaption>Danh sách ví dụ (không nối API).</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className={cn('w-[80px]')}>ID</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Độ khó</TableHead>
                    <TableHead className={cn('text-right')}>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoTableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className={cn('font-mono text-xs')}>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.difficulty}</Badge>
                      </TableCell>
                      <TableCell className={cn('text-right')}>
                        <Badge variant="outline">{row.mode}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Section>

        <footer className={cn('border-t border-border pt-8 text-center text-xs text-muted-foreground')}>
          <p>
            Quay lại{' '}
            <a href="/" className={cn('font-medium text-primary underline-offset-4 hover:underline')}>
              trang chủ
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
