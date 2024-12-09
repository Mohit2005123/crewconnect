import React from 'react';
import { 
  Users, 
  PlusCircle, 
  Calendar, 
  Link, 
  FileText 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function AssignTaskModal({
  isModalOpen,
  setIsModalOpen,
  employees,
  task,
  setTask,
  selectedEmployee,
  setSelectedEmployee,
  deadline,
  setDeadline,
  description,
  setDescription,
  referenceLinks,
  setReferenceLinks,
  handleTaskSubmit
}) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2" /> Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="flex items-center mb-2">
              <FileText className="mr-2 text-blue-500" />
              Task Title
            </label>
            <Input 
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          <div>
            <label className="flex items-center mb-2">
              <Users className="mr-2 text-green-500" />
              Assign To
            </label>
            <Select 
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="flex items-center mb-2">
              <Calendar className="mr-2 text-purple-500" />
              Deadline
            </label>
            <Input 
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center mb-2">
              <FileText className="mr-2 text-orange-500" />
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          <div>
            <label className="flex items-center mb-2">
              <Link className="mr-2 text-teal-500" />
              Reference Links (Optional)
            </label>
            <Textarea
              value={referenceLinks}
              onChange={(e) => setReferenceLinks(e.target.value)}
              placeholder="Enter reference links (one per line)"
            />
          </div>
          <Button type="submit" className="w-full">
            <PlusCircle className="mr-2" /> Assign Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}