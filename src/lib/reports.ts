import { supabase } from './supabase';
import pdfMake from './pdf'; // Import your configured pdfMake instance
import type { SystemSettings } from '../types/database';
import { format } from 'date-fns';

// Define default styles using the default Roboto font
const defaultStyles = {
  header: {
    fontSize: 18,
    bold: true,
    margin: [0, 0, 0, 10]
  },
  subheader: {
    fontSize: 14,
    bold: true,
    margin: [0, 10, 0, 5]
  },
  tableHeader: {
    bold: true,
    fontSize: 12,
    color: 'black',
    fillColor: '#f3f4f6'
  },
  tableCell: {
    fontSize: 10
  }
};

async function getImageDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    throw new Error('Failed to load header image');
  }
}

export interface ReportFilters {
  clientId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectReport {
  project: Project;
  timeEntries: TimeEntry[];
  totalHours: number;
  completedTasks: number;
  totalTasks: number;
}

export async function generatePDF(
  report: ProjectReport, 
  settings?: SystemSettings | null
): Promise<any> {
  try {
    if (!report || !report.project) {
      throw new Error('Invalid report data');
    }

    // If we have a header image, fetch and convert it to data URL
    let headerImageDataUrl: string | undefined;
    if (settings?.pdf_header_image) {
      try {
        headerImageDataUrl = await getImageDataUrl(settings.pdf_header_image);
      } catch (error) {
        console.error('Failed to load header image:', error);
        // Continue without the header image
      }
    }

    const { 
      project, 
      timeEntries = [], 
      totalHours = 0, 
      completedTasks = 0, 
      totalTasks = 0 
    } = report;

    const defaultSettings = {
      pdf_font_family: 'Roboto',
      pdf_font_size_body: 10,
      pdf_font_size_header: 18,
      // Increase the top margin to push content lower,
      // ensuring no overlap with the header
      pdf_margin_top: 130,
      pdf_margin_bottom: 40,
      pdf_margin_left: 40,
      pdf_margin_right: 40,
      pdf_title_format: '{project_name} - Project Report',
      pdf_footer_text: 'Page {page} of {pages} - Generated on {date}'
    };

    const pdfSettings = { ...defaultSettings, ...settings };

    // Utility to replace shortcodes in text
    const replaceShortcodes = (text: string) => {
      return text
        .replace('{project_name}', project.name)
        .replace('{company_name}', (project.company as any)?.name || '')
        .replace('{date}', format(new Date(), 'MMM d, yyyy'))
        .replace('{total_hours}', totalHours.toFixed(1))
        .replace('{tasks_completed}', completedTasks.toString())
        .replace('{tasks_total}', totalTasks.toString())
        .replace('{start_date}', format(new Date(project.start_date), 'MMM d, yyyy'))
        .replace(
          '{end_date}',
          project.end_date 
            ? format(new Date(project.end_date), 'MMM d, yyyy') 
            : 'Not set'
        );
    };

    const title = replaceShortcodes(pdfSettings.pdf_title_format);
    const footerText = replaceShortcodes(pdfSettings.pdf_footer_text);

    // Convert multi-line title into an array of text objects
    const titleLines = title.split('\n').map(line => ({
      text: line.trim(),
      fontSize: pdfSettings.pdf_font_size_header,
      bold: true,
      margin: [0, 0, 0, line === title.split('\n').slice(-1)[0] ? 20 : 5]
    }));

    // Build the PDF definition
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [
        pdfSettings.pdf_margin_left,
        pdfSettings.pdf_margin_top,
        pdfSettings.pdf_margin_right,
        pdfSettings.pdf_margin_bottom
      ],
      defaultStyle: {
        font: pdfSettings.pdf_font_family,
        fontSize: pdfSettings.pdf_font_size_body
      },
      info: {
        title,
        author: 'TaskFlow',
        subject: 'Project Report',
        keywords: 'project, report, time entries'
      },
      // Create a header that includes the image, scaled to fit
      // The margin ensures there's space below the image
      header: headerImageDataUrl
        ? {
            image: headerImageDataUrl,
            // Use 'fit' to constrain the image if you need to guarantee
            // it won't exceed the page width or height
            fit: [520, 120],
            alignment: 'center',
            margin: [0, 10, 0, 20] 
          }
        : undefined,

      // Dynamically generated footer with shortcodes
      footer: (currentPage: number, pageCount: number) => ({
        text: footerText
          .replace('{page}', currentPage.toString())
          .replace('{pages}', pageCount.toString()),
        alignment: 'center',
        margin: [40, 0, 40, 10]
      }),

      content: [
        {
          stack: titleLines,
          alignment: 'center'
        },
        {
          text: project.description || 'No description provided',
          margin: [0, 0, 0, 20],
          fontSize: pdfSettings.pdf_font_size_body
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Project Details', style: 'subheader' },
                { text: `Client: ${(project.company as any)?.name || 'N/A'}` },
                {
                  text: `Start Date: ${
                    project.start_date 
                      ? new Date(project.start_date).toLocaleDateString() 
                      : 'Not set'
                  }`
                },
                project.end_date && {
                  text: `End Date: ${new Date(project.end_date).toLocaleDateString()}`
                }
              ].filter(Boolean)
            },
            {
              width: '*',
              stack: [
                { text: 'Project Statistics', style: 'subheader' },
                { text: `Total Hours: ${Number(totalHours).toFixed(1)}` },
                { text: `Tasks Progress: ${completedTasks}/${totalTasks}` },
                { text: `Allocated Hours: ${project.allocated_hours || 0}` }
              ]
            }
          ]
        },
        // Time Entries Table
        {
          text: 'Time Entries',
          style: 'subheader',
          margin: [0, 20, 0, 10]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'User', style: 'tableHeader' },
                { text: 'Hours', style: 'tableHeader' },
                { text: 'Description', style: 'tableHeader' }
              ],
              ...(timeEntries || []).map(entry => [
                {
                  text: entry.date
                    ? new Date(entry.date).toLocaleDateString()
                    : 'N/A',
                  style: 'tableCell'
                },
                {
                  text: (entry.user as any)?.full_name || 'Unknown',
                  style: 'tableCell'
                },
                {
                  text: Number(entry.hours).toFixed(1),
                  style: 'tableCell'
                },
                {
                  text: entry.description || '-',
                  style: 'tableCell'
                }
              ])
            ]
          }
        }
      ],
      styles: {
        header: {
          fontSize: pdfSettings.pdf_font_size_header,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: Math.floor(pdfSettings.pdf_font_size_header * 0.8),
          bold: true,
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: Math.floor(pdfSettings.pdf_font_size_body * 1.2),
          color: 'black',
          fillColor: '#f3f4f6'
        },
        tableCell: {
          fontSize: pdfSettings.pdf_font_size_body
        }
      }
    };

    // Return a Promise that resolves with the PDF object
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = pdfMake.createPdf(docDefinition);
        resolve(pdfDoc);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        reject(new Error('Failed to initialize PDF generation'));
      }
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw new Error('Failed to prepare PDF document');
  }
}

// Example of how you might fetch the Project + TimeEntry data
export async function generateProjectReport(filters: ReportFilters): Promise<ProjectReport | null> {
  try {
    // Validate required filters
    if (!filters.projectId) {
      throw new Error('Project ID is required');
    }

    // Fetch project data with error handling
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        company:companies(*),
        tasks:tasks(
          id,
          title,
          status,
          time_entries(*)
        )
      `)
      .eq('id', filters.projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) return null;

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        user:users(id, full_name, email),
        task:tasks(id, title, status)
      `)
      .eq('project_id', filters.projectId);

    // Apply date filters if provided
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data: timeEntries, error: timeError } = await query.order('date', { ascending: false });
    if (timeError) {
      console.error('Time entries fetch error:', timeError);
      throw new Error('Failed to fetch time entries');
    }

    const tasks = (project.tasks as any[]) || [];
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalHours = (timeEntries || []).reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Validate the report data
    if (!project || !timeEntries) {
      throw new Error('Invalid report data structure');
    }

    return {
      project,
      timeEntries: timeEntries || [],
      totalHours,
      completedTasks,
      totalTasks: tasks.length
    };
  } catch (error) {
    console.error('Report generation error:', error);
    throw new Error('Failed to generate report data');
  }
}